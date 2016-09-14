/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game, Rob */

"use strict";

Rob.Motioner = function() {
  this.motionIndicator = Rob.XY();
  this.previousStartingPoint = Rob.XY();
};

Rob.Motioner.prototype.init = function() {
};

Rob.Motioner.prototype.ready = function(archon) {
  this.archon = archon;
  this.organs = Object.assign({}, archon.organs);
};

Rob.Motioner.prototype.launch = function() {
  this.zeroToOneRange = Rob.globals.zeroToOneRange;

  var radius = this.archon.sensorRadius;

  this.senseRange = Rob.Range(-radius, radius);
  this.hungerRange = Rob.Range(0, this.organs.dna.embryoThreshold);
  this.speedRange = Rob.Range(-Rob.globals.maxSpeed, Rob.globals.maxSpeed);
  this.centeredZeroToOneRange = Rob.Range(-0.5, 0.5);
  
  this.motionVector = Rob.XY();
  this.organs.temper.launch(this.archon);
  this.organs.locator.reset();
};

Rob.Motioner.prototype.eat = function(foodParticle) {
  this.organs.lizer.eat();
  foodParticle.kill();
};

Rob.Motioner.prototype.tick = function(frameCount) {
  this.frameCount = frameCount;

  var scratch = Rob.XY();

  this.organs.accel.tick();
  if(this.organs.accel.maneuverComplete) {
    var tempVector = this.organs.temper.getTempVector();
    var tasteVector = this.organs.locator.getSenseVector('taste');

    if(this.frameCount % 10 === 0) {
      this.motionVector.reset();

      var m = null, n = null, vScale = null, tempScaled = Rob.XY(), tasteScaled = Rob.XY();

      m = tempVector.getMagnitude();
      if(m > 0) {

        vScale = this.centeredZeroToOneRange.convertPoint(m, Rob.globals.temperatureRange);
      
        tempScaled.set(tempVector.timesScalar(vScale / m));
        tempVector.set(tempScaled.timesScalar(this.organs.dna.tempFactor));
      }
      
      m = tasteVector.getMagnitude();
      if(m > 0) {
        vScale = this.centeredZeroToOneRange.convertPoint(m, this.organs.locator.foodDistanceRange);
      
        tasteScaled.set(tasteVector.timesScalar(vScale / m));
        tasteVector.set(tasteScaled.timesScalar(this.organs.dna.tasteFactor));
      }
      
      // Now both vectors have been put on the -0.5, 0.5 scale, and
      // we've multiplied each by their genetically predetermined
      // importance factor. Now we just go with the one with the
      // greatest magnitude
      m = tempVector.getMagnitude();
      n = tasteVector.getMagnitude();
      if(m > n) {
        this.motionVector.set(tempScaled.normalized().timesScalar(this.archon.sensor.width));
      } else {
        this.motionVector.set(tasteScaled.normalized().timesScalar(this.archon.sensor.width));
      }

      if(this.archon.stopped) {
        this.archon.setVelocity(0);
      } else {
        scratch = this.motionVector.plus(this.archon.getPosition());
        scratch.x = Rob.clamp(scratch.x, 0, game.width);
        scratch.y = Rob.clamp(scratch.y, 0, game.height);

        if(this.archon.justBorn) {
          this.archon.justBorn = false;
          var p = this.archon.getPosition();
          var s = this.archon.getSize();
          var nx = game.rnd.integerInRange(-s * 4, s * 4);
          var ny = game.rnd.integerInRange(-s * 4, s * 4);
          
          this.organs.accel.setTarget(nx + p.x, ny + p.y);
        } else {
          this.organs.accel.setTarget(scratch.x, scratch.y);
        }
      }

      this.motionIndicator.set(this.motionVector);
      this.motionIndicator.normalize();
      this.motionIndicator.scalarMultiply(this.archon.sensor.width / 2);
      this.motionIndicator.add(this.sprite);
    }
  }

  var drawDebugLine = false;
  if(drawDebugLine && !this.motionIndicator.equals(0, 0)) {
    Rob.db.draw(this.sprite, this.motionIndicator, 'green', 1);
  }

  this.organs.locator.reset();
};
