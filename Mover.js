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

  this.optimalTemperature = 0;
};

Rob.Mover.prototype.setTempTarget = function() {
  this.temperatureVector.reset();

  var temperature = theSpreader.getTemperature(this.sprite);
  var bestDeltaT = Math.abs(temperature - this.optimalTemperature);
  var radius = this.sprite.width * 2;

  for(var i = 0; i < 2; i += 1/6) {
    var theta = i * Math.PI;

    var tPointRelative = Rob.XY().polar(1, theta);

    // Check four points on each line, so we don't
    // just blindly go to a point out on our radius circle
    for(var j = 1; j <= 4; j++) {
      var magnitude = (j / 4) * radius;

      var tPointAbsolute = tPointRelative.timesScalar(magnitude).plus(this.sprite);

      temperature = theSpreader.getTemperature(tPointAbsolute);

      var deltaT = Math.abs(temperature - this.optimalTemperature);

      if(deltaT < bestDeltaT) {
        bestDeltaT = deltaT;
        this.temperatureVector.set(tPointRelative).timesScalar(magnitude);
      }
    }
  }

  if(!this.temperatureVector.isEqualTo(0)) {
    this.db.draw(
      this.sprite,
      this.temperatureVector.normalized().timesScalar(this.sprite.width).plus(this.sprite),
      'blue'
    );
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

  this.db.draw(
    this.sprite,
    this.smellVector.normalized().timesScalar(this.sprite.width * 2).plus(this.sprite),
    'yellow'
  );
};

Rob.Mover.prototype.update = function() {

  this.setTempTarget();

  if(this.smelledAnything) {
    this.currentMotionVector.set(this.smellVector.normalized().timesScalar(this.sprite.width));

    this.db.draw(
      this.sprite,
      this.currentMotionVector.plus(this.sprite),
      'green'
    );
  }

  //var t = theSpreader.getTemperature(this.sprite);

  this.smelledAnything = false;
  this.smellVector.reset();
};
