/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

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
    archonCount: 15,
    archonia: {},
    costFactorForGivingBirth: 2,
    costFactorForBeingBorn: 1,
    darknessAlphaHi: 0.3,
    darknessAlphaLo: 0.0,
    maxAcceleration: 15,
    maxSpeed: 75,                   // pix/sec
    minimumAdultMass: 1,            // Below this, an adult will die
    temperatureLo: -1000,
    temperatureHi: 1000,
    worldBorder: 2,                // Make room for our wall sprites
    dailyBirthCounter: 0,
    dailyDeathCounter: 0
  },
  
  clamp: function(value, lo, hi) {
    var c = Math.max(value, lo); c = Math.min(c, hi); return c;
  },

  go: function(runWhichState) {
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
  
  pointInBounds: function(point) {
    var border = 10;
    return point.x > border && point.x < game.width - border && point.y > border && point.y < game.width - border;
  },

  preGameInit: function() {
    Rob.globals_.tideRange = new Rob.Range(1.5, 1);
    Rob.globals_.archonSizeRange = new Rob.Range(0.07, 0.125);
    Rob.globals_.standardArchonTolerableTempRange = new Rob.Range(-500, 500);
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

    Rob.globals_.fatCalorieDensity = 100;             // 100 calories = 1 gram
    Rob.globals_.massOfMiracleBabies = 1;      // In grams
    Rob.globals_.approximateLifeOf100Calories = 45;  // In seconds
    
    // In ticks
    Rob.globals_.approximateLifeOf1Calorie = (
      Rob.globals_.approximateLifeOf100Calories / (Rob.globals_.massOfMiracleBabies * Rob.globals_.fatCalorieDensity) / frameRate
    );
    
    Rob.globals_.typicalCalorieBurnRate = Rob.globals_.approximateLifeOf1Calorie / frameRate;

    // W/in 200˚ of optimal should cost about half the life of a calorie
    Rob.globals_.costPerTemp = Rob.globals_.approximateLifeOf1Calorie / 200 / 2;
    Rob.globals_.costPerExcessTemp = Rob.globals_.costPerTemp * 2;
    
    // Traveling at primordial max speed should cost about half the life of a calorie
    Rob.globals_.costPerSpeed = Rob.globals_.typicalCalorieBurnRate / 2 / Rob.globals_.maxSpeed;
    Rob.globals_.costPerAcceleration = Rob.globals_.costPerSpeed * 2;
    
    Rob.globals_.expectedNumberOfFeedingsToHaveABaby = 2;
    Rob.globals_.typicalMannaCountPerFeeding = 50;
    Rob.globals_.ticksBetweenFeedings = 30 * frameRate;  // 30-ish, that is
    Rob.globals_.caloriesNeededPerFeeding = (
      Rob.globals_.massOfMiracleBabies * Rob.globals_.fatCalorieDensity / Rob.globals_.expectedNumberOfFeedingsToHaveABaby
    );
    Rob.globals_.caloriesNeededBetweenFeedings = Rob.globals_.ticksBetweenFeedings * Rob.globals_.typicalCalorieBurnRate;
    
    Rob.globals_.caloriesNeededForBabyFormation = (
      (Rob.globals_.caloriesNeededPerFeeding * Rob.globals_.expectedNumberOfFeedingsToHaveABaby) + Rob.globals_.caloriesNeededBetweenFeedings
    );
    
    Rob.globals_.caloriesPerMannaMorsel = (
      Rob.globals_.caloriesNeededForBabyFormation / Rob.globals_.typicalMannaCountPerFeeding
    );
    
    Rob.globals_.caloriesGainedPerParasiteBite = Rob.globals_.caloriesPerMannaMorsel * 2 / frameRate;
    Rob.globals_.caloriesLostPerParasiteBite = Rob.globals_.caloriesPerMannaMorsel * 5 / frameRate;
    
    var archonMassRangeLo = Rob.globals_.massOfMiracleBabies / 2;
    var archonMassRangeHi = 4;
    
    Rob.globals_.archonMassRange = new Rob.Range(archonMassRangeLo, archonMassRangeHi);

    Rob.globals_.archonSensorCost = 0.01 / frameRate;   // Calories per second for having a sensor; larger sensor costs more
    
    Rob.globals = new Proxy(Rob.globals_, {
      get: function(target, name) { if(name in target) { return target[name]; } else { debugger; } }
    });
  },

  realInRange: function(lo, hi) {
    return game.rnd.realInRange(lo, hi);
  },

  setupBitmaps: function() {
    Rob.bg = new Rob.Bitmap('rectGradient');
    Rob.db = new Rob.Bitmap('debugBackground');
    Rob.rg = new Rob.Bitmap('realityGoo');
    Rob.wg = new Rob.Bitmap('wallsGoo');
    Rob.pg = new Rob.Bitmap('reportBackground');
  }
};

})();

if(typeof window === "undefined") {
  module.exports = Rob;
} else {
  window.onload = function() { Rob.go(runWhichState); };
  window.onerror = function(message, source, lineno, colno, error) {
    console.log(message);
    console.log(source);
    console.log('Line', lineno, 'Column', colno);
    console.log(error);
    debugger;
  };
}
