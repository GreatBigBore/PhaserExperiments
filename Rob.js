/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global Phaser */
/* exported theSpreader, theAngles, theSun */

"use strict";

var game = null;
var runWhichState = 'Spreader';
var theSpreader = null;
var theAngles = null;
var theSun = null;

window.onload = function() { Rob.go(runWhichState); };

var Rob = {
  debugText: "",

  globals: {
    adultFatCalorieDensity: 500,    // Calories per gram of mass
    archonCount: 1,
    babyFatCalorieDensity: 2000,    // Calories per gram of mass
    caloriesPerMannaMorsel: 50,
    darknessAlphaHi: 0.3,
    darknessAlphaLo: 0.0,
    embryoCalorieDensity: 10000,    // Very high density fat stored for making babies
    maxSpeed: 50,                   // pix/sec
    standardBabyMass: 0.5,          // Grams
    temperatureLo: -1000,
    temperatureHi: 1000,
    worldBorder: 2                // Make room for our wall sprites
  },

  clamp: function(value, lo, hi) {
    var c = Math.max(value, lo); c = Math.min(value, hi); return c;
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

  preGameInit: function() {
    // At this point, I don't expect them ever to weigh more than 10g.
    // For now I'll have them die when their mass gets down to 0.1g;
    // by default, until mutations set in, the birth mass is 0.5g
    Rob.globals.archonMassRange = Rob.Range(0.25, 10);
    Rob.globals.archonSizeRange = Rob.Range(0.07, 0.30);
    Rob.globals.standardArchonTolerableTempRange = Rob.Range(-200, 200);
    Rob.globals.archonColorRange = Rob.Range(1, 255);
    Rob.globals.darknessRange = Rob.Range(Rob.globals.darknessAlphaHi, Rob.globals.darknessAlphaLo);
    Rob.globals.zeroToOneRange = Rob.Range(0, 1);
    Rob.globals.temperatureRange = Rob.Range(Rob.globals.temperatureLo, Rob.globals.temperatureHi);
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
