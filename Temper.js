/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

"use strict";

var Rob = Rob || {};

if(typeof window === "undefined") {
  Rob = require('./XY.js');
}

(function(Rob) {

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
    
    e.where.set(this.sprite);
    e.where.add(0, j);

    if(Rob.pointInBounds(e.where)) {
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

Rob.Temper.prototype.launch = function(archon) {
  this.sprite = archon.sprite;
  this.optimalLoTemp = archon.dna.optimalLoTemp;
  this.optimalTemp = archon.dna.optimalTemp;
  this.optimalHiTemp = archon.dna.optimalHiTemp;
  this.senseLimit = archon.sensor.width / 2;
};

})(Rob);

if(typeof window === "undefined") {
  module.exports = Rob;
}
