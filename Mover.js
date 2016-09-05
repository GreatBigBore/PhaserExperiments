/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game, Rob, theMover, theSpreader */

"use strict";

Rob.Mover = function(sprite, db) {
  theMover = this;  // jshint ignore: line
  this.sprite = sprite;
  this.body = sprite.body;

  this.db = db;

  this.motionVector = Rob.XY();
  this.smellVectors = Rob.XY();
  this.tempVectors = Rob.XY();

  this.optimalTemperature = 0;
  this.frameCount = 0;
  this.smellFactor = 1;
  this.tempFactor = 1;
  this.velocityFactor = 1;
};

Rob.Mover.prototype.setTempVectors = function() {
  var radius = this.sprite.sensor.width / 2;

  for(var i = 0; i < 2; i += 1/6) {
    var theta = i * Math.PI;

    var relativePosition = Rob.XY().polar(radius, theta);
    var absolutePosition = relativePosition.plus(this.sprite);
    var temperature = theSpreader.getTemperature(absolutePosition);
    var deltaT = Math.abs(temperature - this.optimalTemperature);

    // Value falls off like gravity
    var value = 1 / Math.pow(deltaT, 2);

    this.tempVectors.add(relativePosition.normalized().timesScalar(value));

    this.db.draw(this.sprite, absolutePosition, 'black');
  }
};

Rob.Mover.prototype.overlap = function(sensor, smellGroup) {
  game.physics.arcade.overlap(sensor, smellGroup, this.smell, null, this);
};

Rob.Mover.prototype.smell = function(me, smell) {
  var relativePosition = Rob.XY(smell).minus(this.sprite);
  var distance = relativePosition.getMagnitude();

  // Value falls off like gravity
  var value = 1 / Math.pow(distance, 2);

  this.smellVectors.add(relativePosition.normalized().timesScalar(value));

  this.db.draw(this.sprite, smell, 'yellow');
};

Rob.Mover.prototype.update = function() {
  this.frameCount++;

  this.setTempVectors();

  this.smellFactor = 200;
  this.tempFactor = 100;
  this.velocityFactor = 1;

  if(this.frameCount % 1 === 0) {
    this.motionVector.reset();
    this.motionVector.add(this.tempVectors.timesScalar(this.tempFactor));
    this.motionVector.add(this.smellVectors.timesScalar(this.smellFactor));
    this.motionVector.add(Rob.XY(this.body.velocity).timesScalar(this.velocityFactor));
    this.motionVector.normalize();
    this.motionVector.scalarMultiply(30);
    var wtfVector = Rob.XY(this.motionVector);
    this.body.velocity.setTo(this.motionVector.x, this.motionVector.y);

    this.db.draw(
      this.sprite,
      wtfVector.normalized().timesScalar(this.sprite.sensor.width).plus(this.sprite),
      'green', 1
    );
  }

  this.motionVector.reset();
  this.smellVectors.reset();
  this.tempVectors.reset();
};
