/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

"use strict";

var Rob = Rob || {};

if(typeof window === "undefined") {
  Rob = require('./XY.js');
}

(function(Rob) {

Rob.Temper = function(gameCenter) {
  this.tempVector = Rob.XY();
  
  // This is so we can function properly in both
  // the live and test harness environments. If
  // we don't do this, we have to declare a global
  // game variable for the benefit of the test
  // harness, but then we don't run properly. This
  // works better
  this.gameCenter = gameCenter;
  
  this.testPoints = [];
  for(var i = 0; i < 3; i++) {
    this.testPoints.push({ where: Rob.XY(), delta: null, signedDelta: null });
  }
};

Rob.Temper.prototype.getTempVector = function() {
  var e = null;
  
  for(var i = 0, j = -this.senseLimit; i < this.testPoints.length; i++, j += this.senseLimit) {
    e = this.testPoints[i];
    
    e.where.set(this.archon.position);
    e.where.add(0, j);
    
    // For checking whether we're in bounds, we don't care about the x,
    // just the y; we want to ignore temps above us or below us if
    // they're out of bounds. The x of a sprite can be technically out
    // of bounds if the sprite is really small, but as long as it's
    // within the world borders, which I think (?) it always will be,
    // then temp checks should work (should!)
    var boundsCheck = Rob.XY(e.where); 
    boundsCheck.x = this.gameCenter;

  
    if(Rob.pointInBounds(boundsCheck)) {
      var t = Rob.getTemperature(e.where);
      var signedDelta = t - this.archon.optimalTemp; // So we can get a direction
      var delta = Math.abs(signedDelta);             // So we can get a magnitude
      
      e.signedDelta = signedDelta;
      e.delta = delta;
    } else {
      e.delta = null;
      e.signedDelta = null;
    }
  }
  
  var bestDelta = null;
  var bestIndex = null;
  
  for(i = 0; i < this.testPoints.length; i++) {
    e = this.testPoints[i];
    
    if(e.delta !== null &&
      (bestDelta === null || Math.abs(e.delta) < Math.abs(bestDelta))) {
      bestDelta = e.delta;
      bestIndex = i;
    }
  }

  this.tempVector.set(0, 1);
  this.tempVector.scalarMultiply(e.signedDelta);
  
  return this.tempVector;
};

Rob.Temper.prototype.howUncomfortableAmI = function(baseValue) {
  return Math.abs(baseValue * this.archon.tempFactor);
};

Rob.Temper.prototype.launch = function(archon) {
  this.archon = archon;

  this.senseLimit = archon.sensorRadius;
  
  this.tempRange = new Rob.Range(0, 1000);
};

})(Rob);

if(typeof window === "undefined") {
  module.exports = Rob;
}
