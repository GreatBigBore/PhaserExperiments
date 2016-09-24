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
    Rob.globals_.standardArchonTolerableTempRange = new Rob.Range(-200, 200);
    Rob.globals_.archonColorRange = new Rob.Range(1, 255);
    Rob.globals_.darknessRange = new Rob.Range(Rob.globals_.darknessAlphaHi, Rob.globals_.darknessAlphaLo);
    Rob.globals_.zeroToOneRange = new Rob.Range(0, 1);
    Rob.globals_.oneToZeroRange = new Rob.Range(1, 0);
    Rob.globals_.temperatureRange = new Rob.Range(Rob.globals_.temperatureLo, Rob.globals_.temperatureHi);
		Rob.globals_.buttonHueRange = new Rob.Range(240, 0);	// Blue (240) is cold, Red (0) is hot
    Rob.globals_.normalZeroCenterRange = new Rob.Range(-0.5, 0.5);
    Rob.globals_.testTemperatureRange = new Rob.Range(-500, 500);
    Rob.globals_.oneToTenRange = new Rob.Range(1, 10);
    
    // Fat density is fixed by god
    // Adult fat density = 1 gram / calorie
    // Baby fat density = 0.1 gram / calorie
    // What you're born with should last you 45 sec
    // --> typical metabolism cost in calories ~ primordial baby calories / 45
    // -->        meaning typical temp cost + typical motion cost
    // --> # calories you need for having baby = gene-determined baby mass * baby fat calorie density
    // Two feedings should allow you 30more seconds of life and to have one baby
    // Estimate 50 morsels per feeding, so 100
    // to have a baby, you need 100 cal * entropy cost
    // If we make it such that you need two feedings to have a baby,
    //    and about 30 sec between feedings, then you need 170+ cal.
    //    If you can get 50 manna per feeding, that's 100 manna, so let's say 2cal / manna
    
    // typical temp cost ~ 1/2 typical metabolism cost for anything w/in 200˚ of optimal
    // typical speed cost also
    
    var frameRate = 60;

    Rob.globals_.dayLength = 60;  // In seconds

    Rob.globals_.massOfMiracleBabies = 1;             // In grams
    Rob.globals_.fatCalorieDensity = 100;             // 100 calories = 1 gram
    Rob.globals_.lifeOf100Calories = Rob.globals_.dayLength * 0.5;  // 100 calories should last you 1/2 day
    Rob.globals_.miracleCalories = 100;               // 1g of real mass plus this extra massless embryonic nutrition
    
    // This is in calories per second -- 3 1/3
    Rob.globals_.nominalCalorieBurnRate = (
      (Rob.globals_.massOfMiracleBabies * Rob.globals_.fatCalorieDensity) / Rob.globals_.lifeOf100Calories
    );
    
    // 1 2/3 each
    Rob.globals_.nominalTempCostPerSecond = Rob.globals_.nominalCalorieBurnRate / 2;
    Rob.globals_.nominalMotionCostPerSecond = Rob.globals_.nominalCalorieBurnRate / 2;
    
    // 0.0028
    Rob.globals_.nominalCostPerInRangeTemp = (
      Rob.globals_.nominalTempCostPerSecond / 
      (Rob.globals_.standardArchonTolerableTempRange.hi - Rob.globals_.standardArchonTolerableTempRange.lo) / 3
    );
    
    // 0.0056
    Rob.globals_.nominalCostPerExcessTemp = Rob.globals_.nominalCostPerInRangeTemp * 2;

    // 0.0074, 0.0148
    Rob.globals_.nominalCostPerMagnitudeV = Rob.globals_.nominalMotionCostPerSecond / Rob.globals_.maxMagnitudeV / 3;
    Rob.globals_.nominalCostPerMagnitudeA = Rob.globals_.nominalCostPerMagnitudeV * 2;
    
    Rob.globals_.estimatedMannaEatenPerFeeding = 50;
    Rob.globals_.estimatedFeedingDuration = Rob.globals_.dayLength / 4;
    Rob.globals_.nominalTimeBetweenFeedings = Rob.globals_.dayLength / 4;
    
    // I decree that you should have to eat twice to build the reserves necessary for a baby
    // This is in seconds
    Rob.globals_.decreedNumberOfFeedingsForMakingABaby = 2;
    
    // 45!
    Rob.globals_.nominalTimeForMakingABaby = (
      (Rob.globals_.decreedNumberOfFeedingsForMakingABaby * Rob.globals_.estimatedFeedingDuration) +
      Rob.globals_.nominalTimeBetweenFeedings
    );
    
    Rob.globals_.nominalReservesBeforeEmbryoBuilding = 1.5; // Your own birth weight plus this as reserves
    Rob.globals_.nominalBirthThresholdMultiplier = 1.1;     // Have some excess before you risk having a baby

    // 275 -- This is nominally how many calories you should have on board in order to have a baby
    // (In addition to your own nominal birth weight)
    Rob.globals_.nominalBirthThreshold = (
      (Rob.globals_.massOfMiracleBabies + Rob.globals_.nominalReservesBeforeEmbryoBuilding) *
      Rob.globals_.fatCalorieDensity * Rob.globals_.nominalBirthThresholdMultiplier
    );
    
    // This is just to keep my own body going through the feedings and the gaps between
    // 150
    Rob.globals_.caloriesToSurviveBabyTime = Rob.globals_.nominalCalorieBurnRate * Rob.globals_.nominalTimeForMakingABaby;

    // 425
    Rob.globals_.totalCaloriesNeededToSpreadGenes = (
      Rob.globals_.nominalBirthThreshold + Rob.globals_.caloriesToSurviveBabyTime
    );
    
    // Hopefully I've done the math right, and this will give us at least a rough
    // idea of how many calories we need in each manna morsel
    // 4.25
    Rob.globals_.caloriesPerMannaMorsel = (
      Rob.globals_.totalCaloriesNeededToSpreadGenes /
      (Rob.globals_.estimatedMannaEatenPerFeeding * Rob.globals_.decreedNumberOfFeedingsForMakingABaby)
    );
    
    // It seems like it should be worth at least three manna to be worth
    // my while even to be a parasite
    Rob.globals_.caloriesGainedPerParasiteBite = Rob.globals_.caloriesPerManna * 3;
    
    // Has to be greater than what the predator can gain
    Rob.globals_.caloriesLostPerParasiteBite = Rob.globals_.caloriesGainedPerParasiteBite * 2;

///////////////////////////////////////////



    Rob.globals_.nominalCalorieBurnRate /= frameRate;

    Rob.globals_.nominalTempCostPerTick = Rob.globals_.nominalTempCostPerSecond / frameRate;
    Rob.globals_.nominalMotionCostPerTick = Rob.globals_.nominalMotionCostPerSecond / frameRate;
    
    Rob.globals_.nominalCostPerInRangeTemp = (
      Rob.globals_.nominalTempCostPerTick /       // Converted from secs to ticks
      (Rob.globals_.standardArchonTolerableTempRange.hi - Rob.globals_.standardArchonTolerableTempRange.lo) / 3
    );
    
    Rob.globals_.nominalCostPerExcessTemp = Rob.globals_.nominalCostPerInRangeTemp * 2;

    Rob.globals_.nominalCostPerMagnitudeV /= frameRate;
    Rob.globals_.nominalCostPerMagnitudeA = Rob.globals_.nominalCostPerMagnitudeV * 2;
    
    Rob.globals_.estimatedMannaEatenPerFeeding = 50;
    Rob.globals_.estimatedFeedingDuration = Rob.globals_.dayLength / 4 * frameRate;
    Rob.globals_.nominalTimeBetweenFeedings = Rob.globals_.dayLength / 4 * frameRate;
    
    Rob.globals_.decreedNumberOfFeedingsForMakingABaby = 2;
    
    Rob.globals_.nominalTimeForMakingABaby = (
      (Rob.globals_.decreedNumberOfFeedingsForMakingABaby * Rob.globals_.estimatedFeedingDuration) +
      Rob.globals_.nominalTimeBetweenFeedings
    );
    
    Rob.globals_.nominalReservesBeforeEmbryoBuilding = 1.5; // Your own birth weight plus this as reserves
    Rob.globals_.nominalBirthThresholdMultiplier = 1.1;     // Have some excess before you risk having a baby

    Rob.globals_.nominalBirthThreshold = (
      (Rob.globals_.massOfMiracleBabies + Rob.globals_.nominalReservesBeforeEmbryoBuilding) *
      Rob.globals_.fatCalorieDensity * Rob.globals_.nominalBirthThresholdMultiplier
    );
    
    Rob.globals_.caloriesToSurviveBabyTime = Rob.globals_.nominalCalorieBurnRate * Rob.globals_.nominalTimeForMakingABaby;

    Rob.globals_.totalCaloriesNeededToSpreadGenes = (
      Rob.globals_.nominalBirthThreshold + Rob.globals_.caloriesToSurviveBabyTime
    );
    
    Rob.globals_.caloriesPerMannaMorsel = (
      0.25 *      // Still trial and error; even after all these careful calculations, the manna is too nutritious
      Rob.globals_.totalCaloriesNeededToSpreadGenes /
      (Rob.globals_.estimatedMannaEatenPerFeeding * Rob.globals_.decreedNumberOfFeedingsForMakingABaby)
    );
    
    Rob.globals_.caloriesGainedPerParasiteBite = Rob.globals_.caloriesPerMannaMorsel * 3 / 60;
    
    Rob.globals_.caloriesLostPerParasiteBite = Rob.globals_.caloriesGainedPerParasiteBite * 2;

    Rob.globals_.caloriesGainedPerInjuredParasiteBite = Rob.globals_.caloriesGainedPerParasiteBite * 10;

///////////////////////////////////////////
        
    var archonMassRangeLo = Rob.globals_.massOfMiracleBabies / 2;
    var archonMassRangeHi = 4;
    
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
