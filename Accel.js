/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

"use strict";

var Rob = Rob || {};

(function(Rob) {

Rob.Accel = function() {
  this.maneuverStamp = 0;
  this.maneuverAdjustStamp = 0;
  this.maneuverComplete = true;
  this.needUpdate = false;
  this.damper = 10;

  this.maneuverTimeout = 2 * 60;
  this.frameCount = 0;
  
  this.currentSpeed = 0;
  this.currentAcceleration = 0;
  
  this.target = Rob.XY();
};

Rob.Accel.prototype = {
  
  getMotion: function() { return { mVelocity: this.currentSpeed, mAcceleration: this.currentAcceleration }; },
  
  launch: function(archon) {
    this.archon = archon;
  },
  
  setTarget: function(target) {
    this.target.set(target);
    this.maneuverStamp = this.frameCount;

    this.currentSpeed = this.archon.maxMVelocity;
    this.currentAcceleration = this.archon.maxMAcceleration;
    if(this.archon.mover.feeding) {
      this.currentSpeed *= this.archon.feedingSpeedDamper;
      this.currentAcceleration *= this.archon.feedingAccelerationDamper;
    }

    this.maneuverComplete = false;
    this.setNewVelocity();
  },

  setNewVelocity: function() {
    this.maneuverAdjustStamp = this.frameCount;

    // Get his into the same frame of reference as the velocity vector
    var currentVelocity = Rob.XY(this.archon.velocity);

    // Get the angle between my velocity vector and
    // the distance vector from me to him.
    var optimalDeltaV = this.target.minus(this.archon.position).plus(currentVelocity);
    var optimalDeltaM = optimalDeltaV.getMagnitude();
    var thetaToTarget = optimalDeltaV.getAngleFrom(0);

    this.needUpdate = (optimalDeltaM > this.currentSpeed);
  
    var curtailedM = Math.min(optimalDeltaM, this.currentSpeed);
    var curtailedV = Rob.XY.fromPolar(curtailedM, thetaToTarget);

    // Now we need to know how much change we intend to apply
    // to the current velocity vectors, so we can scale that
    // change back to limit the acceleration.
    var bestDeltaV = curtailedV.minus(currentVelocity);
    var bestDeltaM = bestDeltaV.getMagnitude();
    
    if(bestDeltaM > this.currentAcceleration) {
      this.needUpdate = true;
    
      bestDeltaV.scalarMultiply(this.currentAcceleration / bestDeltaM);
    }

    var newVelocity = bestDeltaV.plus(this.archon.velocity);

    this.archon.velocity.set(newVelocity);

    this.currentAcceleration = bestDeltaV.getMagnitude();
    this.currentSpeed = newVelocity.getMagnitude();
  },

  tick: function(frameCount) {
    this.frameCount = frameCount; // Need this for setting maneuver timestamps
    
    if(this.frameCount > (this.maneuverStamp + this.maneuverTimeout)) {
      this.maneuverComplete = true;
      this.currentSpeed *= 0.99;
    }

    if(
      !this.maneuverComplete && this.needUpdate &&
      this.frameCount > this.maneuverAdjustStamp + this.damper) {
      this.setNewVelocity();
    }
  }
};

})(Rob);

if(typeof window === "undefined") {
  module.exports = Rob;
}
