/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global Phaser */

"use strict";

var game = null;
var runWhichState = 'Spreader';

var Rob = (function() {
  var thing = {
  debugText: "",

  globals: {
    adultFatCalorieDensity: 250,    // Calories per gram of mass
    archonCount: 25,
    archonia: {},
    babyFatCalorieDensity: 1000,    // Calories per gram of mass
    caloriesPerMannaMorsel: 25,
    darknessAlphaHi: 0.3,
    darknessAlphaLo: 0.0,
    embryoCalorieDensity: 5000,    // Very high density fat stored for making babies
    lizerCostPerAcceleration: 0.11 / 60,  // Cost of overcoming inertia
    lizerCostPerMass: 0.1,          // Mass of 10g costs 1 calorie per tick
    lizerCostPerSpeed: 0.011 / 60,  // Cost of overcoming friction
    lizerCostPerTemp: 0.01 / 60,    // Diff by 100˚ costs 1 calorie per second
    maxAcceleration: 15,
    maxSpeed: 75,                   // pix/sec
    minimumAdultMass: 1,            // Below this, an adult will die
    standardBabyMass: 0.5,          // Grams
    temperatureLo: -1000,
    temperatureHi: 1000,
    worldBorder: 2                // Make room for our wall sprites
  },

  clamp: function(value, lo, hi) {
    var c = Math.max(value, lo); c = Math.min(c, hi); return c;
  },

  dumpGenePool: function() {
    Rob.globals.archonia.archons.dumpGenePool();
  },

  go: function(runWhichState) {
    Rob.preGameInit();

    game = new Phaser.Game(600, 600, Phaser.CANVAS);

    var states = [
      'Spreader'
    ];

    for(var i in states) {
      game.state.add(states[i], Rob[states[i]], false);
    }

    game.state.start(runWhichState);
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
    // At this point, I don't expect them ever to weigh more than 10g.
    // For now I'll have them die when their mass gets down to 0.1g;
    // by default, until mutations set in, the birth mass is 0.5g
    Rob.globals.archonMassRange = Rob.Range(0.25, 10);
    Rob.globals.archonSizeRange = Rob.Range(0.07, 0.125);
    Rob.globals.standardArchonTolerableTempRange = Rob.Range(-200, 200);
    Rob.globals.archonColorRange = Rob.Range(1, 255);
    Rob.globals.darknessRange = Rob.Range(Rob.globals.darknessAlphaHi, Rob.globals.darknessAlphaLo);
    Rob.globals.zeroToOneRange = Rob.Range(0, 1);
    Rob.globals.oneToZeroRange = Rob.Range(1, 0);
    Rob.globals.temperatureRange = Rob.Range(Rob.globals.temperatureLo, Rob.globals.temperatureHi);
		Rob.globals.buttonHueRange = Rob.Range(240, 0);	// Blue (240) is cold, Red (0) is hot
  },

  realInRange: function(lo, hi) {
    return game.rnd.realInRange(lo, hi);
  },

  setupBitmaps: function() {
    Rob.bg = new Rob.Bitmap('rectGradient');
    Rob.db = new Rob.Bitmap('debugBackground');
    Rob.rg = new Rob.Bitmap('realityGoo');
    Rob.rg = new Rob.Bitmap('wallsGoo');
  }
};

  return thing;
})();

if(typeof window === "undefined") {
  exports.Rob = Rob;
} else {
  window.onload = function() { Rob.go(runWhichState); };
}
