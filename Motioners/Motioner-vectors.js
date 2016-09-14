/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game, Rob */

"use strict";

Rob.Motioner = function() {
  this.frameCount = 0;

};

Rob.Motioner.prototype.init = function(archon) {
  this.archon = archon;
  this.sprite = archon.sprite;
  this.body = archon.sprite.body;
  this.mover = archon.mover;
  this.lizer = archon.lizer;
  this.sensor = archon.sensor;
  this.dna = archon.dna;
  this.reach = this.sprite.width * 2;

  this.motionIndicator = Rob.XY();
  this.previousStartingPoint = Rob.XY();
  
  this.temper = new Rob.Temper();
  this.locator = new Rob.Locator(archon);
};

Rob.Motioner.prototype.launch = function() {
  this.accel = new Rob.Accel(this.sprite);
  this.zeroToOneRange = Rob.globals.zeroToOneRange;

  var radius = this.sensor.width / 2;

  this.senseRange = Rob.Range(-radius, radius);
  this.hungerRange = Rob.Range(0, this.dna.embryoThreshold);
  this.speedRange = Rob.Range(-Rob.globals.maxSpeed, Rob.globals.maxSpeed);
  this.centeredZeroToOneRange = Rob.Range(-0.5, 0.5);
  
  this.motionVector = Rob.XY();
  this.temper.launch(this.archon);
  this.locator.reset();
};

Rob.Motioner.prototype.eat = function(foodParticle) {
  this.lizer.eat();
  foodParticle.kill();
};

Rob.Motioner.prototype.update = function() {
  this.frameCount++;

  var scratch = Rob.XY();

  this.accel.tick();
  if(this.accel.maneuverComplete) {
    var tempVector = this.temper.getTempVector();
    var tasteVector = this.locator.getSenseVector('taste');

    if(this.frameCount % 10 === 0) {
      this.motionVector.reset();

      var m = null, n = null, vScale = null, tempScaled = Rob.XY(), tasteScaled = Rob.XY();

      m = tempVector.getMagnitude();
      if(m > 0) {

        vScale = this.centeredZeroToOneRange.convertPoint(m, Rob.globals.temperatureRange);
      
        tempScaled.set(tempVector.timesScalar(vScale / m));
        tempVector.set(tempScaled.timesScalar(this.dna.tempFactor));
      }
      
      m = tasteVector.getMagnitude();
      if(m > 0) {
        vScale = this.centeredZeroToOneRange.convertPoint(m, this.locator.foodDistanceRange);
      
        tasteScaled.set(tasteVector.timesScalar(vScale / m));
        tasteVector.set(tasteScaled.timesScalar(this.dna.tasteFactor));
      }
      
      // Now both vectors have been put on the -0.5, 0.5 scale, and
      // we've multiplied each by their genetically predetermined
      // importance factor. Now we just go with the one with the
      // greatest magnitude
      m = tempVector.getMagnitude();
      n = tasteVector.getMagnitude();
      if(m > n) {
        this.motionVector.set(tempScaled.normalized().timesScalar(this.sensor.width));
      } else {
        this.motionVector.set(tasteScaled.normalized().timesScalar(this.sensor.width));
      }

      if(this.archon.stopped) {
        this.body.velocity.setTo(0, 0);
      } else {
        scratch = this.motionVector.plus(this.sprite);
        scratch.x = Rob.clamp(scratch.x, 0, game.width);
        scratch.y = Rob.clamp(scratch.y, 0, game.height);

        if(this.archon.justBorn) {
          this.archon.justBorn = false;
          var nx = game.rnd.integerInRange(-this.sprite.width * 4, this.sprite.width * 4);
          var ny = game.rnd.integerInRange(-this.sprite.height * 4, this.sprite.height * 4);
          
          this.accel.setTarget(nx + this.sprite.x, ny + this.sprite.y);
        } else {
          this.accel.setTarget(scratch.x, scratch.y);
        }
      }

      this.motionIndicator.set(this.motionVector);
      this.motionIndicator.normalize();
      this.motionIndicator.scalarMultiply(this.sensor.width / 2);
      this.motionIndicator.add(this.sprite);
    }
  }

  var drawDebugLine = false;
  if(drawDebugLine && !this.motionIndicator.equals(0, 0)) {
    Rob.db.draw(this.sprite, this.motionIndicator, 'green', 1);
  }

  this.sensor.x = this.sprite.x; this.sensor.y = this.sprite.y;

  this.locator.reset();
};
