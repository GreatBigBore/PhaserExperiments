/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global Phaser, Rob */

"use strict";

var game = null;
var runWhichState = 'Spreader';
window.onload = function() { Rob.go(runWhichState); }

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

  makeAlien: function(owner, x, y) {
    owner.alien = game.add.sprite(x, y, 'alien');
    owner.alien.anchor.set(0.5, 0.5);
    owner.alien.inputEnabled = true;
    owner.alien.input.enableDrag();
  }
};
