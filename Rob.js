/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global Phaser */
/* exported theSpreader, theMover, theAngles, theSun, theMannaGenerator, theMannaGarden */

"use strict";

var game = null;
var runWhichState = 'Spreader';
var theSpreader = null;
var theMover = null;
var theAngles = null;
var theSun = null;
var theMannaGenerator = null;
var theMannaGarden = null;

window.onload = function() { Rob.go(runWhichState); };

var Rob = {
  go: function(runWhichState) {
    game = new Phaser.Game(600, 600, Phaser.CANVAS);

    var states = [
      'Angles', 'Mover', 'Spreader'
    ];

    for(var i in states) {
      game.state.add(states[i], Rob[states[i]], false);
    }

    game.state.start(runWhichState);
  },

  integerInRange: function(lo, hi) {
    return Math.floor(Rob.realInRange(lo, hi));
  },

  makeAlien: function(owner, x, y) {
    owner.alien = game.add.sprite(x, y, 'alien');
    owner.alien.anchor.set(0.5, 0.5);
    owner.alien.inputEnabled = true;
    owner.alien.input.enableDrag();
  },

  realInRange: function(lo, hi) {
    var array = new Uint32Array(1);
    window.crypto.getRandomValues(array);

    return array[0] / Math.pow(2, 32) * (hi - lo) + lo;
  }
};
