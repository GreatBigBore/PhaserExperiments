/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game, Rob */

"use strict";

Rob.Angles = function() {
  theAngles = this;
};

Rob.Angles.prototype.create = function() {
  this.bg = new Rob.Bitmap('rectGradient');
  this.db = new Rob.Bitmap('debugBackground');

  this.makeAlien();
};

Rob.Angles.prototype.init = function() {
};

Rob.Angles.prototype.makeAlien = function() {
  Rob.makeAlien(this);
};

Rob.Angles.prototype.preload = function() {
  game.load.image('alien', 'assets/sprites/ufo.png');
};

Rob.Angles.prototype.update = function() {
  this.db.update();

  this.db.draw(
    {x: game.width / 2, y: game.height * 1/4},
    {x: game.width / 2, y: game.height * 3/4}, 'black', 0.5
  );

  this.db.draw(
    {x: game.width * 1/4, y: game.height / 2},
    {x: game.width * 3/4, y: game.height / 2}, 'black', 0.5
  );

  var centerX = game.width / 2;
  var centerY = game.height / 2;
  var relX = this.alien.x - centerX;
  var relY = this.alien.y - centerY;
  var relTheta = Math.atan2(relY, relX);
  var relCos = Math.cos(relTheta);
  var relSin = Math.sin(relTheta);

  this.db.text(
    0, 0,
    "P to 0: (" + this.alien.x.toFixed(0) + ", " + this.alien.y.toFixed() + ") " +
    "Angle to 0: " + Math.atan2(this.alien.y, this.alien.x).toFixed(4) + "\n" +
    "P to center: (" + relX.toFixed(0) + ", " + relY.toFixed(0) + ") " +
    "Angle to center: " + relTheta.toFixed(4) + "\n" +
    "x/y from A to C: (" + relCos.toFixed(4) + ", " + relSin.toFixed(4) + ")"
  );
};
