/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game, Phaser, Rob, roblog */

"use strict";

var Rob = Rob || {};

(function(Rob) {

Rob.Accel = function(sprite) {
  this.dna = sprite.archon.dna;
  this.frameCount = 0;
  this.maneuverStamp = 0;
  this.maneuverComplete = true;
  this.needUpdate = false;
  this.damper = 10;
  this.cancelAfter = 30; // Cancel maneuvers that take too long
  this.expiresAt = 0;

  this.sprite = sprite;
  this.body = sprite.body;

  this.maxSpeed = this.dna.maxVelocity;
  this.maxAcceleration = this.dna.maxAcceleration;

  this.currentSpeed = this.maxSpeed;

  this.currentTargetX = this.sprite.x;
  this.currentTargetY = this.sprite.y;

  this.stuckCount = 0;
  this.previousX = sprite.x;
  this.previousY = sprite.y;
};

Rob.Accel.prototype = {
  
  getMotion: function() {
    return {
    };
  },

  setTarget: function(hisX, hisY) {
    var speed = this.maxSpeed;
    var acceleration = this.maxAcceleration;

    this.currentSpeed = speed;
    this.currentAcceleration = acceleration;

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
    var relX = this.hisX - this.sprite.x;
    var relY = this.hisY - this.sprite.y;

    var vX = this.body.velocity.x;
    var vY = this.body.velocity.y;

    // Get the angle between my velocity vector and
    // the distance vector from me to him.

    var deltaD = Math.sqrt(Math.pow(vX + relX, 2) + Math.pow(vY + relY, 2));
    var thetaToTarget = Math.atan2(vY + relY, vX + relX);

    this.needUpdate = (deltaD > this.currentSpeed);
    deltaD = Math.min(deltaD, this.currentSpeed);

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

    /*if(
      (Math.sign(relX) !== Math.sign(aCurtailedX)) ||
      (Math.sign(relY) !== Math.sign(aCurtailedY))
    ) {
      if(this.sprite.archon.uniqueID === 0) {
        console.log(
          "Rel (" + relX.toFixed(4) + " , " + relY.toFixed(4) + "), " +
          "new (" + aCurtailedX.toFixed(4) + ", " + aCurtailedY.toFixed(4) + ")"
        );
      }
    }*/

    if(deltaV > this.dna.maxAcceleration) {
      this.needUpdate = true;

      bestDeltaX *= this.dna.maxAcceleration / deltaV;
      bestDeltaY *= this.dna.maxAcceleration / deltaV;

      aCurtailedX = bestDeltaX + this.body.velocity.x;
      aCurtailedY = bestDeltaY + this.body.velocity.y;
    }

    var finalX = bestDeltaX + this.body.velocity.x;
    var finalY = bestDeltaY + this.body.velocity.y;

    this.body.velocity.setTo(finalX, finalY);
  },

  tick: function() {
    this.frameCount++;

    if(
      !this.maneuverComplete && this.needUpdate &&
      this.frameCount > this.maneuverStamp + this.damper) {
      this.setNewVelocity();
    }

    if(this.maneuverComplete) {
      this.body.velocity.x *= 0.9; this.body.velocity.y *= 0.9;
    } else {
      if(this.previousX === Math.floor(this.sprite.x) &&
        this.previousY === Math.floor(this.sprite.y)) {
        this.stuckCount++;
      }

      var me = new Phaser.Point(this.hisX, this.hisY);
      me.floor();

      this.previousX = Math.floor(this.sprite.x); this.previousY = Math.floor(this.sprite.y);

      if(Phaser.Point.distance(me, this.sprite) < 20 || this.stuckCount > 30) {
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
