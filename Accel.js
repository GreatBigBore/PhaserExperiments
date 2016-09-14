/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global Phaser */

"use strict";

var Rob = Rob || {};

(function(Rob) {

Rob.Accel = function() {
  this.maneuverStamp = 0;
  this.maneuverComplete = true;
  this.needUpdate = false;
  this.damper = 10;
  this.cancelAfter = 30; // Cancel maneuvers that take too long
  this.expiresAt = 0;

  this.stuckCount = 0;
  this.previousX = null;
  this.previousY = null;

  this.currentMVelocity = 0;
  this.currentMAcceleration = 0;
};

Rob.Accel.prototype = {
  
  getMotion: function() { return { mVelocity: this.currentMVelocity, mAcceleration: this.currentMAcceleration }; },
  
  init: function() {
  },
  
  launch: function() {},
  
  ready: function(archon) {
    this.archon = archon;
    this.organs = Object.assign({}, archon.organs);

    this.position = archon.position;
    this.velocity = archon.velocity;
  },

  setTarget: function(hisX, hisY) {
    this.hisX = hisX;
    this.hisY = hisY;

    this.maneuverComplete = false;
    this.expiresAt = this.frameCount + this.cancelAfter;
    this.setNewVelocity();
  },

  setNewVelocity: function() {
    if(this.frameCount > this.expiresAt) {
      this.maneuverComplete = true;
      return;
    }

    this.maneuverStamp = this.frameCount;

    // Get his into the same frame of reference as the velocity vector
    var relX = this.hisX - this.position.x;
    var relY = this.hisY - this.position.y;

    var vX = this.velocity.x;
    var vY = this.velocity.y;

    // Get the angle between my velocity vector and
    // the distance vector from me to him.

    var deltaD = Math.sqrt(Math.pow(vX + relX, 2) + Math.pow(vY + relY, 2));
    var thetaToTarget = Math.atan2(vY + relY, vX + relX);

    this.needUpdate = (deltaD > this.organs.dna.maxVelocity);
    deltaD = Math.min(deltaD, this.organs.dna.maxVelocity);

    var vCurtailedX = Math.cos(thetaToTarget) * deltaD;
    var vCurtailedY = Math.sin(thetaToTarget) * deltaD;

    // Now we need to know how much change we intend to apply
    // to the current velocity vectors, so we can scale that
    // change back to limit the acceleration.
    var bestDeltaX = vCurtailedX - vX;
    var bestDeltaY = vCurtailedY - vY;

    var deltaV = Math.sqrt(Math.pow(bestDeltaX, 2) + Math.pow(bestDeltaY, 2));

    // These two are just so I can show debug info
    var aCurtailedX = vCurtailedX;
    var aCurtailedY = vCurtailedY;

    if(deltaV > this.organs.dna.maxAcceleration) {
      this.needUpdate = true;

      bestDeltaX *= this.organs.dna.maxAcceleration / deltaV;
      bestDeltaY *= this.organs.dna.maxAcceleration / deltaV;

      aCurtailedX = bestDeltaX + this.velocity.x;
      aCurtailedY = bestDeltaY + this.velocity.y;
      
      this.currentMAcceleration = this.organs.dna.maxAcceleration;
    } else {
      this.currentMAcceleration = deltaV;
    }

    var finalX = bestDeltaX + this.velocity.x;
    var finalY = bestDeltaY + this.velocity.y;
    
    this.currentMVelocity = Math.sqrt(Math.pow(finalX, 2) + Math.pow(finalY, 2));

    this.velocity.set(finalX, finalY);
  },

  tick: function() {
    this.frameCount++;

    if(
      !this.maneuverComplete && this.needUpdate &&
      this.frameCount > this.maneuverStamp + this.damper) {
      this.setNewVelocity();
    }

    if(this.maneuverComplete) {
      this.velocity.scalarMultiply(0.9);
    } else {
      if(this.previousX === Math.floor(this.archon.getPosition().x) &&
        this.previousY === Math.floor(this.archon.getPosition().y)) {
        this.stuckCount++;
      }

      var me = Rob.XY(this.hisX, this.hixY).floored();
      var p = this.archon.getPosition().floored();

      this.previousX = p.x; this.previousY = p.y;

      if(p.getDistanceTo(me) < 20 || this.stuckCount > 30) {
        this.maneuverComplete = true;
        this.stuckCount = 0;
      }
    }
  }
};

})(Rob);

if(typeof window === "undefined") {
  module.exports = Rob;
}
