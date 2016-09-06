/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global Rob, theSpreader */

"use strict";

Rob.Motioner = function(mover) {
  this.mover = mover;
  this.sprite = mover.sprite;
  this.body = this.mover.body;
  this.sensor = mover.sensor;
  this.dna = mover.dna;
  this.frameCount = 0;

  this.vectors = {
    motion: Rob.XY(),
    smell: Rob.XY(),
    taste: Rob.XY(),
    temp: Rob.XY()
  };
};

Rob.Motioner.prototype.eat = function() {

};

Rob.Motioner.prototype.setTempVectors = function() {
  var radius = this.sensor.width / 2;

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
    var deltaT = Math.abs(temperature - this.dna.optimalTemp);

    // Value falls off like gravity, but scale it first, so it
    // will be in the same ball park as the senses
    deltaT = senseRange.convertPoint(deltaT, tempRange);
    var value = 1 / Math.pow(deltaT, 2);

    this.vectors.temp.add(relativePosition.normalized().timesScalar(value));

    //Rob.db.draw(this.sprite, absolutePosition, 'black', 0.5);
  }
};

Rob.Motioner.prototype.sense = function(sense, sensee) {
  var relativePosition = Rob.XY(sensee).minus(this.sprite);
  var distance = relativePosition.getMagnitude();

  // Value falls off like gravity
  var value = 1 / Math.pow(distance, 2);

  this.vectors[sense].add(relativePosition.normalized().timesScalar(value));

  if(sense === 'smell') { this.smellCount++; } else { this.tasteCount++; }
  var color = sense === 'smell' ? 'yellow' : 'cyan';
  Rob.db.draw(this.sprite, sensee, color);
};

Rob.Motioner.prototype.smell = function(smellyParticle) {
  this.sense('smell', smellyParticle);
};

Rob.Motioner.prototype.taste = function(tastyParticle) {
  this.sense('taste', tastyParticle);
};

Rob.Motioner.prototype.update = function() {
  this.setTempVectors();

  this.dna.tempFactor = 1;
  this.dna.smellFactor = 1;
  this.dna.tasteFactor = 1;
  this.dna.velocityFactor = 1;

  if(this.frameCount % 10 === 0) {
  /*  theSpreader.debugText(
      "˚: " + this.vectors.temp.X(4) + ", " + this.vectors.temp.Y(4) + "\n" +
      "s: " + this.vectors.smell.X(4) + ", " + this.vectors.smell.Y(4) + "\n" +
      "t: " + this.vectors.taste.X(4) + ", " + this.vectors.taste.Y(4)
    );*/

    this.vectors.motion.reset();
    this.vectors.motion.add(this.vectors.temp.timesScalar(this.dna.tempFactor));
    //this.vectors.motion.add(this.vectors.smell.timesScalar(this.dna.smellFactor));
    //this.vectors.motion.add(this.vectors.taste.timesScalar(this.dna.tasteFactor));
    //this.vectors.motion.add(Rob.XY(this.body.velocity).timesScalar(this.dna.velocityFactor));
    this.vectors.motion.normalize();
    this.vectors.motion.scalarMultiply(this.dna.motionMultiplier);
    var wtfVector = Rob.XY(this.vectors.motion);
    this.body.velocity.setTo(this.vectors.motion.x, this.vectors.motion.y);

    Rob.db.draw(
      this.sprite,
      wtfVector.normalized().timesScalar(this.sensor.width).plus(this.sprite),
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
