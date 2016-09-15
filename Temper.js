/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

"use strict";

var Rob = Rob || {};
var game = game || {};

if(typeof window === "undefined") {
  Rob = require('./XY.js');
  
  game = { width: 50 }; // For the test harness
}

(function(Rob, game) {

Rob.Temper = function() {
  this.tempVector = Rob.XY();
  
  this.testPoints = [];
  for(var i = 0; i < 3; i++) {
    this.testPoints.push({ where: Rob.XY(), delta: null });
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
    boundsCheck.x = game.width / 2;

    if(Rob.pointInBounds(boundsCheck)) {
      var t = Rob.getTemperature(e.where);
      var r = null, d = null;
      
      // If we're outside our comfortable range, make a number that's larger
      // than just the delta between current temp and optimal, to indicate
      // the urgency of the matter
      if(t > this.optimalHiTemp) {
        r = this.optimalHiTemp - this.optimalTemp;
        d = t - this.optimalTemp;
        e.delta = d + (50 * d / r);
      } else if(t < this.optimalLoTemp) {
        r = this.optimalTemp - this.optimalLoTemp;
        d = t - this.optimalTemp;
        e.delta = d + (50 * d / r);
      } else {
        e.delta = t - this.optimalTemp;
      }
    } else {
      e.delta = null;
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
  
  // Rather than x === 0, because that makes us just go straight
  // up and down, which is boring
  var x = Rob.integerInRange(-this.senseLimit, this.senseLimit);
  
  this.tempVector.set(x, bestDelta);
  
  return this.tempVector;
};

Rob.Temper.prototype.init = function() {
  
};

Rob.Temper.prototype.launch = function() {
};

Rob.Temper.prototype.tick = function(/*frameCount*/) {
};

Rob.Temper.prototype.ready = function(archon) {
  this.archon = archon;
  
  this.organs = Object.assign({}, archon.organs);

  this.optimalLoTemp = archon.organs.dna.optimalLoTemp;
  this.optimalTemp = archon.organs.dna.optimalTemp;
  this.optimalHiTemp = archon.organs.dna.optimalHiTemp;
  this.senseLimit = archon.sensor.width / 2;
};

})(Rob, game);

if(typeof window === "undefined") {
  module.exports = Rob;
}
