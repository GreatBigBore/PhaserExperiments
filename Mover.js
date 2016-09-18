/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global roblog */

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
    return this.archon.temper.getTempVector();
  },
  
  getTasteVector: function() {
    return this.archon.locator.getSenseVector('taste');
  },
  
  launch: function(archon) {
    this.archon = archon;
    this.noNewTargetUntil = this.archon.targetChangeDelay;
    this.jitterReductionActive = false;
  },
  
  tick: function(frameCount) {
    if(!this.archon.stopped && frameCount > this.noNewTargetUntil) {
      var m = 0, mTemp = 0, mTaste = 0;
      
      var tempVector = this.getTempVector();
      var tasteVector = this.getTasteVector();

      // Don't count taste if we haven't tasted anything
      m = tasteVector.getMagnitude();

      if(this.archon.uniqueID === 0) {
        roblog('target', 'taste raw', tasteVector.x, tasteVector.y);
        roblog('target', 'temp raw', tempVector.x, tempVector.y);
      }
    
      if(m > 0) {
        mTaste = Rob.globals.zeroToOneRange.convertPoint(m, this.archon.locator.foodDistanceRange);
        tasteVector.scaleTo(mTaste);
        
        // If there's any food, don't let my goofy random
        // x-coordinate stuff influence the decision by adding
        // fake magnitude to the temp vector
        tempVector.x = 0;
      }
      
      m = tempVector.getMagnitude();
      mTemp = Rob.globals.zeroToOneRange.convertPoint(m, this.archon.temper.tempRange);
      tempVector.scaleTo(mTemp);
    
      if(this.archon.uniqueID === 0) {
        roblog('target', 'taste 0-1', tasteVector.x, tasteVector.y);
        roblog('target', 'temp 0-1', tempVector.x, tempVector.y);
        roblog('target', 'position', this.archon.position.x, this.archon.position.y);
      }

      var finalVector = Rob.XY();
      
      if(this.archon.temper.howUncomfortableAmI(mTemp) > this.archon.lizer.howHungryAmI(mTaste)) {
        tempVector.scalarMultiply(this.archon.sensorWidth);
        tempVector.add(this.archon.position);
     
        if(this.archon.uniqueID === 0) {
          roblog('target', 'temp set', tempVector.x, tempVector.y);
        }
        
        finalVector.set(tempVector);
      } else {
        tasteVector.scalarMultiply(this.archon.sensorWidth);
        tasteVector.add(this.archon.position);
        
        if(this.archon.uniqueID === 0) {
          roblog('target', 'taste set', tasteVector.x, tasteVector.y);
        }
        
        finalVector.set(tasteVector);
      }

      this.noNewTargetUntil = frameCount + this.archon.targetChangeDelay;

      if(Rob.pointInBounds(finalVector)) {
        this.archon.accel.setTarget(finalVector);
        this.jitterReductionActive = false;
      } else {
        if(!this.jitterReductionActive) {
          // Hopefully this will reduce the jitter at the edges
          this.noNewTargetUntil += this.archon.targetChangeDelay;
          this.jitterReductionActive = true;
        }
      }
    
      this.archon.locator.reset();
    }
  }
  
};

})(Rob);

if(typeof window === "undefined") {
  module.exports = Rob;
}
