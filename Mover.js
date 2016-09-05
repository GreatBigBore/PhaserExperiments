/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game, Rob, theMover, theSpreader */

"use strict";

Rob.Mover = function(sprite, db) {
  theMover = this;  // jshint ignore: line
  this.sprite = sprite;
  this.body = sprite.body;

  this.db = db;
  this.smelledAnything = false;

  this.currentMotionVector = Rob.XY();
  this.smellVector = Rob.XY();
  this.temperatureVector = Rob.XY();
  this.wallsVector = Rob.XY();

  this.optimalTemperature = 0;
  this.frameCount = 0;
};

Rob.Mover.prototype.setTempVector = function() {
  this.temperatureVector.reset();

  var temperature = theSpreader.getTemperature(this.sprite);
  var bestDeltaT = Math.abs(temperature - this.optimalTemperature);
  var radius = this.sprite.sensor.width / 2;

  for(var i = 0; i < 2; i += 1/6) {
    var theta = i * Math.PI;

    var tPointRelative = Rob.XY().polar(radius, theta);

    var tPointAbsolute = tPointRelative.plus(this.sprite);

    this.db.draw(
      this.sprite,
      tPointAbsolute,
      'black'
    );

    temperature = theSpreader.getTemperature(tPointAbsolute);

    var deltaT = Math.abs(temperature - this.optimalTemperature);

    if(deltaT < bestDeltaT) {
      bestDeltaT = deltaT;
      this.temperatureVector.set(tPointRelative);
    }
  }
};

Rob.Mover.prototype.overlap = function(sensor, smellGroup) {
  game.physics.arcade.overlap(sensor, smellGroup, this.smell, null, this);
};

Rob.Mover.prototype.smell = function(me, smell) {
  this.smelledAnything = true;
  var relativePosition = Rob.XY(smell).minus(this.sprite);
  var distance = relativePosition.getMagnitude();

  // Value falls off like gravity
  var value = 1 / Math.pow(distance, 2);

  this.smellVector.add(relativePosition.timesScalar(value));
};

Rob.Mover.prototype.update = function() {
  this.frameCount++;

  this.setTempVector();

  if(this.frameCount % 10 === 0) {
    this.currentMotionVector.set(this.smellVector);
    this.currentMotionVector.add(this.temperatureVector);
    this.currentMotionVector.add(Rob.XY(this.body.velocity).timesScalar(25));
    this.currentMotionVector.normalize();
    this.currentMotionVector.scalarMultiply(30);
    var wtfVector = Rob.XY(this.currentMotionVector);
    this.body.velocity.setTo(this.currentMotionVector.x, this.currentMotionVector.y);

    theSpreader.debugText(
      "T: " + this.temperatureVector.X(4) + ", " + this.temperatureVector.Y(4) + "\n" +
      "S: " + this.smellVector.X(4) + ", " + this.smellVector.Y(4) + "\n" +
      "V: " + this.body.velocity.x.toFixed(4) + ", " + this.body.velocity.y.toFixed(4)
    );

    this.db.draw(
      this.sprite,
      this.smellVector.normalized().timesScalar(this.sprite.sensor.width).plus(this.sprite),
      'yellow', 2
    );

    /*if(!this.temperatureVector.isEqualTo(0)) {
      this.db.draw(
        this.sprite,
        this.temperatureVector.normalized().timesScalar(this.sprite.sensor.width).plus(this.sprite),
        'red', 2
      );
    }*/

    this.db.draw(
      this.sprite,
      wtfVector.normalized().timesScalar(this.sprite.sensor.width).plus(this.sprite),
      'green', 1
    );
  }

  //var t = theSpreader.getTemperature(this.sprite);

  this.smelledAnything = false;
  this.smellVector.reset();
  this.currentMotionVector.reset();
};
