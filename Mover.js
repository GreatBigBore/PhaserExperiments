/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game, Rob, theSpreader */

"use strict";

Rob.Mover = function(sprite) {
  this.sprite = sprite;
  this.body = sprite.body;
  this.sensor = sprite.sensor;

  this.frameCount = 0;

  this.vectors = {
    motion: Rob.XY(),
    smell: Rob.XY(),
    taste: Rob.XY(),
    temp: Rob.XY()
  };

  this.d = new Rob.DNA();

  this.sprite.tint = this.d.getTint();
  this.tasteCount = 0;
  this.smellCount = 0;
};

Rob.Mover.prototype.setTempVectors = function() {
  var radius = this.sprite.sensor.width / 2;

  // Get temp into the same order of magnitude as the sense vectors
  // Smell and taste fall off like gravity, so the range is
  // from zero to the square of 1 / radius
  var senseRange = new Rob.Range(radius, 0);
  var tempRange = new Rob.Range(theSpreader.temperatureRange.lo, theSpreader.temperatureRange.hi);

  for(var i = 0; i < 2; i += 1/12) {
    var theta = i * Math.PI;

    var relativePosition = Rob.XY().polar(radius, theta);
    var absolutePosition = relativePosition.plus(this.sprite);
    var temperature = theSpreader.getTemperature(absolutePosition);
    var deltaT = Math.abs(temperature - this.d.optimalTemp);

    // Value falls off like gravity, but scale it first, so it
    // will be in the same ball park as the senses
    deltaT = senseRange.convertPoint(deltaT, tempRange);
    var value = 1 / Math.pow(deltaT, 2);

    this.vectors.temp.add(relativePosition.normalized().timesScalar(value));

    Rob.db.draw(this.sprite, absolutePosition, 'black');
  }
};

Rob.Mover.prototype.smell = function(sensor, smellyParticle) {
  this.sense('smell', sensor, smellyParticle);
};

Rob.Mover.prototype.taste = function(sensor, tastyParticle) {
  this.sense('taste', sensor, tastyParticle);
};

Rob.Mover.prototype.sense = function(sense, me, sensee) {
  var relativePosition = Rob.XY(sensee).minus(this.sprite);
  var distance = relativePosition.getMagnitude();

  // Value falls off like gravity
  var value = 1 / Math.pow(distance, 2);

  this.vectors[sense].add(relativePosition.normalized().timesScalar(value));

  if(sense === 'smell') { this.smellCount++; } else { this.tasteCount++; }
  var color = sense === 'smell' ? 'yellow' : 'cyan';
  Rob.db.draw(this.sprite, sensee, color);
};

Rob.Mover.prototype.update = function() {
  this.frameCount++;

  this.setTempVectors();

  this.d.tempFactor = 1;
  this.d.smellFactor = 1;
  this.d.tasteFactor = 1;
  this.d.velocityFactor = 1;

  if(this.frameCount % 10 === 0) {
    theSpreader.debugText(
      "˚: " + this.vectors.temp.X(4) + ", " + this.vectors.temp.Y(4) + "\n" +
      "s: " + this.vectors.smell.X(4) + ", " + this.vectors.smell.Y(4) + "\n" +
      "t: " + this.vectors.taste.X(4) + ", " + this.vectors.taste.Y(4)
    );

    this.vectors.motion.reset();
    this.vectors.motion.add(this.vectors.temp.timesScalar(this.d.tempFactor));
    this.vectors.motion.add(this.vectors.smell.timesScalar(this.d.smellFactor));
    this.vectors.motion.add(this.vectors.taste.timesScalar(this.d.tasteFactor));
    this.vectors.motion.add(Rob.XY(this.body.velocity).timesScalar(this.d.velocityFactor));
    this.vectors.motion.normalize();
    this.vectors.motion.scalarMultiply(this.d.motionMultiplier);
    var wtfVector = Rob.XY(this.vectors.motion);
    this.body.velocity.setTo(this.vectors.motion.x, this.vectors.motion.y);

    Rob.db.draw(
      this.sprite,
      wtfVector.normalized().timesScalar(this.sprite.sensor.width).plus(this.sprite),
      'green', 1
    );
  }

  this.sensor.x = this.sprite.x; this.sensor.y = this.sprite.y;

  this.smellCount = 0;
  this.tasteCount = 0;
  for(var i in this.vectors) {
    this.vectors[i].reset();
  }
};
