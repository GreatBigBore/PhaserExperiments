/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global Proxy */

"use strict";

var Rob = null;
var runWhichState = 'Spreader';

var game = game || {}, Phaser = Phaser || {};

if(typeof window === "undefined") {
  game = require('./PhaserMockups/game.js');
  Phaser = require('./PhaserMockups/Phaser.js');
}

(function() {
  
Rob = {
  debugText: "",

  globals_: {
    archonCount: 25,
    archonia: {},
    costFactorForGivingBirth: 2,
    costFactorForBeingBorn: 1,
    darknessAlphaHi: 0.3,
    darknessAlphaLo: 0.0,
    maxMagnitudeA: 15,
    maxAcceleration: 15,
    maxMagnitudeV: 75,
    maxSpeed: 75,                   // pix/sec
    minimumAdultMass: 1,            // Below this, an adult will die
    temperatureLo: -1000,
    temperatureHi: 1000,
    worldBorder: 2,                // Make room for our wall sprites
    dailyBirthCounter: 0,
    dailyDeathCounter: 0,
    worldBoundsBorder: 15
  },
  
  clamp: function(value, lo, hi) {
    var c = Math.max(value, lo); c = Math.min(c, hi); return c;
  },
  
  fuzzyEqual: function(bounds, lhs, rhs) {
    return Math.abs(rhs - lhs) < bounds;
  },

  go: function() {
    Rob.preGameInit();

    game = new Phaser.Game(600, 600, Phaser.CANVAS);
    
    game.state.add('Spreader', Rob.Spreader, false);
    game.state.add('Extinction', { create: function() { console.log("They're all dead, and you're a terrible person"); } }, false);

    game.state.start('Spreader');
  },

  integerInRange: function(lo, hi) {
    return game.rnd.integerInRange(lo, hi);
  },

  makeAlien: function(owner, x, y) {
    owner.alien = game.add.sprite(x, y, 'alien');
    owner.alien.anchor.set(0.5, 0.5);
    owner.alien.inputEnabled = true;
    owner.alien.input.enableDrag();
  },
  
  numberFix: function(value, decimals) {
    // It is damned hard in js to determine whether you have a number!
    if(typeof value === "number") { if(!isNaN(value)) { if(isFinite(value)) { value = parseFloat(value).toFixed(decimals);
    } else { value = '<infinity>'; } } }
    
    return value;
  },
  
  pointInBounds: function(point) {
    var border = Rob.globals.worldBoundsBorder;
    return point.x > border && point.x < game.width - border && point.y > border && point.y < game.width - border;
  },
  
  pointInXBounds: function(point) {
    var border = Rob.globals.worldBoundsBorder * 2;
    return point.x > border && point.x < game.width - border;
  },
  
  pointXBoundsSign: function(point) {
    return point.x - (game.width - Rob.globals.worldBoundsBorder);
  },
  
  pointInYBounds: function(point) {
    var border = Rob.globals.worldBoundsBorder * 2;
    return point.y > border && point.y < game.height - border;
  },
  
  pointYBoundsSign: function(point) {
    return point.y - (game.height - Rob.globals.worldBoundsBorder);
  },

  preGameInit: function() {
    Rob.globals_.tideRange = new Rob.Range(1.5, 1);
    Rob.globals_.archonSizeRange = new Rob.Range(0.07, 0.125);
    Rob.globals_.archonColorRange = new Rob.Range(1, 255);
    Rob.globals_.darknessRange = new Rob.Range(Rob.globals_.darknessAlphaHi, Rob.globals_.darknessAlphaLo);
    Rob.globals_.zeroToOneRange = new Rob.Range(0, 1);
    Rob.globals_.oneToZeroRange = new Rob.Range(1, 0);
    Rob.globals_.temperatureRange = new Rob.Range(Rob.globals_.temperatureLo, Rob.globals_.temperatureHi);
		Rob.globals_.buttonHueRange = new Rob.Range(240, 0);	// Blue (240) is cold, Red (0) is hot
    Rob.globals_.normalZeroCenterRange = new Rob.Range(-0.5, 0.5);
    Rob.globals_.testTemperatureRange = new Rob.Range(-500, 500);
    Rob.globals_.oneToTenRange = new Rob.Range(1, 10);

    Rob.globals_.standardArchonTolerableTempDelta = 200;
    Rob.globals_.standardArchonTolerableTempRange = new Rob.Range(
      -Rob.globals_.standardArchonTolerableTempDelta, Rob.globals_.standardArchonTolerableTempDelta
    );

    var fatDensity = 100;                  // Calories per gram
    var babyFatDensity = 1000;             // Calories per gram
    var embryoFatDensity = 1000;              // Calories per gram; should be same as baby fat density

    // Organize the newborn fat such that we'll be born with 200 calories, weighing just over a gram
    var babyFatAtBirth = 100;             // 100g baby fat + 100g adult fat gives us 1.1g
    var adultFatAtBirth = 100;
    var nominalOffspringEnergy = 200;     // Actual number of calories in a newborn

    var frameRate = 60;                    // ticks per second
    var dayLength = 60;                    // in seconds
    var lifeOf100Calories = 0.5;             // in days
    var optimalAdultMass = 1.5;            // grams -- weigh this much before embryo building starts
    var costFactorForGivingBirth = 1.25;         // It takes an extra 25% of the offspring mass; this is lost to entropy
    var starvingAdultMass = adultFatAtBirth;      // Basically the minimum mass an adult can tolerate
    var mannaPerFeeding = 50;              // Probably won't be this high
    var feedingsPerDay = 2;                // Max -- they might miss one; tough

    var calorieBurnRate = lifeOf100Calories / dayLength;  // calories per second

    var standardTempBurnRate = 0.5 * (1/3) * calorieBurnRate; // cal/sec; total temp is half total burn rate; standard rate is half excess rate
    var excessTempBurnRate = 2 * standardTempBurnRate;        // cal/sec
    var mVelocityBurnRate = standardTempBurnRate;             // cal/sec; total motion cost half total burn, same as temp
    var mAccelerationBurnRate = 2 * mVelocityBurnRate;        // same as excess temp

    var birthThresholdMultiplier = 1.1; // Safety cushion; grow a little bigger than nominal before giving birth
    var caloriesRequiredForGivingBirth = nominalOffspringEnergy * costFactorForGivingBirth;  // entropy cost + nominal baby mass
    var adultFullPregnancyMass = (optimalAdultMass * fatDensity) + caloriesRequiredForGivingBirth; // (cal) when you're this big, your baby is born
    var diffBetweenFullPregnancyAndStarving = (adultFullPregnancyMass - starvingAdultMass) * birthThresholdMultiplier;
    
    var howLongToReachBearingMass = 0.5;    // In days

    // manna/sec, averaged over the day
    var nominalMannaIntakeRate = mannaPerFeeding * feedingsPerDay / (dayLength * howLongToReachBearingMass);
    var caloriesPerMannaForStagnation = nominalMannaIntakeRate / calorieBurnRate;
    var caloriesPerMannaForBreeding = diffBetweenFullPregnancyAndStarving / (nominalMannaIntakeRate / calorieBurnRate);
    var caloriesPerManna = caloriesPerMannaForStagnation + caloriesPerMannaForBreeding;

    calorieBurnRate /= frameRate;
    caloriesPerManna /= frameRate;
    mAccelerationBurnRate /= frameRate;
    mVelocityBurnRate /= frameRate;
    excessTempBurnRate /= frameRate;
    standardTempBurnRate /= frameRate;
    
    Rob.globals_.dayLength = dayLength;
    Rob.globals_.fatDensity = fatDensity;
    Rob.globals_.babyFatDensity = babyFatDensity;
    Rob.globals_.embryoFatDensity = embryoFatDensity;
    Rob.globals_.standardTempBurnRate = standardTempBurnRate;
    Rob.globals_.excessTempBurnRate = excessTempBurnRate;
    Rob.globals_.mVelocityBurnRate = mVelocityBurnRate;
    Rob.globals_.mAccelerationBurnRate = mAccelerationBurnRate;
    Rob.globals_.caloriesPerManna = caloriesPerManna;
    Rob.globals_.caloriesGainedPerParasiteBite = Rob.globals_.caloriesPerManna * 3;
    Rob.globals_.caloriesLostPerParasiteBite = Rob.globals_.caloriesGainedPerParasiteBite * 2;
    Rob.globals_.nominalBirthThresholdMultiplier = birthThresholdMultiplier;
    Rob.globals_.costFactorForGivingBirth = costFactorForGivingBirth;
    Rob.globals_.adultFullPregnancyMass = adultFullPregnancyMass;
    Rob.globals_.optimalAdultMass = optimalAdultMass;
    
    Rob.globals_.nominalOffspringEnergy = nominalOffspringEnergy;
    Rob.globals_.babyFatAtBirth = babyFatAtBirth;             // 100g baby fat + 100g adult fat gives us 1.1g
    Rob.globals_.adultFatAtBirth = adultFatAtBirth;
        
    var archonMassRangeLo = 0.5;
    var archonMassRangeHi = 50;
    
    Rob.globals_.archonMassRange = new Rob.Range(archonMassRangeLo, archonMassRangeHi);

    Rob.globals_.archonSensorCost = 0.01 / frameRate; // Calories per second for having a sensor; larger sensor costs more
    Rob.globals_.parasitismCost = 0.1 / frameRate;    // Being a parasite requires extra metabolic machinery
    
    Rob.globals = new Proxy(Rob.globals_, {
      get: function(target, name) {
        if(name in target) { return target[name]; }
        else { debugger; } }  // jshint ignore: line
    });
  },

  realInRange: function(lo, hi) {
    return game.rnd.realInRange(lo, hi);
  },

  rPad: function(value, length, character) {
    if(value.length + 1 < length) {
      value += ' ';               // Always make first char a space
    }

    if(character === undefined) { character = ' '; }

    if(value.length + 3 > length) { character = ' '; }  // If the input is too short, pad, but not with dots

    for(var i = value.length; i < length; i++) {
      value += character;
    }
  
    return value;
  },

  lPad: function(value, length, character) {
    if(character === undefined) { character = ' '; }

    for(var i = (value).toString().length - 1; i < length; i++) {
      value = character + value;
    }
  
    return value;
  },

  setupBitmaps: function() {
    Rob.bg = new Rob.Bitmap('rectGradient');
    Rob.db = new Rob.Bitmap('debugBackground');
    Rob.rg = new Rob.Bitmap('realityGoo');
    Rob.wg = new Rob.Bitmap('parasiteGoo');
    Rob.pg = new Rob.Bitmap('reportBackground');
  }
};

})();

if(typeof window === "undefined") {
  module.exports = Rob;
} else {
  window.onload = function() { Rob.go(runWhichState); };
}
