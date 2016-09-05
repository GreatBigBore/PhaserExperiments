/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game, Rob */

"use strict";

Rob.Mover = function(sprite, db) {
  theMover = this;
  this.sprite = sprite;
  this.body = sprite.body;

  this.db = db;

  this.currentMotionVector = Rob.XY();
  this.smellVector = Rob.XY();
};

Rob.Mover.prototype.overlap = function(sensor, smellGroup) {
  game.physics.arcade.overlap(sensor, smellGroup, this.smell, null, this);
};

Rob.Mover.prototype.smell = function(me, smell) {
  var relativePosition = Rob.XY(smell).minus(this.sprite);
  var distance = relativePosition.getMagnitude();

  // Value falls off like gravity
  var value = 1 / Math.pow(distance, 2);

  this.smellVector.add(relativePosition.timesScalar(value));

  this.text = "(" + this.smellVector.X(2) + ", " + this.smellVector.Y(2) + ")";
};

Rob.Mover.prototype.update = function() {

  if(!this.smellVector.isEqualTo(0)) {
    this.currentMotionVector.set(this.smellVector.normalized().timesScalar(this.sprite.width));

    this.text += "(" + this.currentMotionVector.X(2) + ", " + this.currentMotionVector.Y(2) + ")";
    this.db.text(0, 0, this.text);

    this.db.draw(
      this.sprite,
      this.currentMotionVector.plus(this.sprite),
      'blue');
  }

  var t = theSpreader.getTemperature(this.sprite);

  this.smellVector.reset();
};
