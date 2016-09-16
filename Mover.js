/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

"use strict";

var Rob = Rob || {};

if(typeof window === "undefined") {
  var xy = require('./XY.js');
  var range = require('./Range.js');
  
  Rob = Object.assign(Rob, xy, range);
}

(function(Rob) {

Rob.Mover = function() {
};

Rob.Mover.prototype = {
  
  getTempVector: function() {
    return this.archon.organs.temper.getTempVector();
  },
  
  getTasteVector: function() {
    return this.archon.organs.locator.getSenseVector('taste');
  },
  
  init: function() {
  },
  
  launch: function() {
    this.noNewTargetUntil = this.archon.organs.dna.targetChangeDelay;
  },
  
  ready: function(archon) {
    this.archon = archon;
    this.organs = Object.assign({}, archon.organs);
  },
  
  tick: function(frameCount) {
    if(!this.archon.stopped && frameCount > this.noNewTargetUntil) {
      var m = 0, mTemp = 0, mTaste = 0;
      
      var tempVector = this.getTempVector();
      var tasteVector = this.getTasteVector();
      
      // Don't count taste if we haven't tasted anything
      m = tasteVector.getMagnitude();
      if(m > 0) {
        mTaste = Rob.globals.normalZeroCenterRange.convertPoint(m, this.archon.organs.locator.foodDistanceRange);
      }
      
      m = tempVector.getMagnitude();
      mTemp = Rob.globals.normalZeroCenterRange.convertPoint(m, this.archon.organs.temper.tempRange);
    
      if(Math.abs(mTemp * this.archon.organs.dna.tempFactor) > Math.abs(mTaste * this.archon.organs.dna.tasteFactor)) {
        tempVector.normalize();
        tempVector.scalarMultiply(this.archon.sensorWidth);
        tempVector.add(this.archon.position);
        
        this.archon.organs.accel.setTarget(tempVector);
      } else {
        tasteVector.normalize();
        tasteVector.scalarMultiply(this.archon.sensorWidth);
        tasteVector.add(this.archon.position);
        
        this.archon.organs.accel.setTarget(tasteVector);
      }
      
      this.noNewTargetUntil = frameCount + this.archon.organs.dna.targetChangeDelay;
    
      this.archon.organs.locator.reset();
    }
  }
  
};

})(Rob);

if(typeof window === "undefined") {
  module.exports = Rob;
}
