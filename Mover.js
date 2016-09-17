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

      if(this.archon.uniqueID === 0) {
        roblog('target', 'taste raw', tasteVector.x, tasteVector.y);
        roblog('target', 'temp raw', tempVector.x, tempVector.y);
      }
    
      if(m > 0) {
        mTaste = Rob.globals.zeroToOneRange.convertPoint(m, this.archon.organs.locator.foodDistanceRange);
        tasteVector.scaleTo(mTaste);
        
        // If there's any food, don't let my goofy random
        // x-coordinate stuff influence the decision by adding
        // fake magnitude to the temp vector
        tempVector.x = 0;
      }
      
      m = tempVector.getMagnitude();
      mTemp = Rob.globals.zeroToOneRange.convertPoint(m, this.archon.organs.temper.tempRange);
      tempVector.scaleTo(mTemp);
    
      if(this.archon.uniqueID === 0) {
        roblog('target', 'taste 0-1', tasteVector.x, tasteVector.y);
        roblog('target', 'temp 0-1', tempVector.x, tempVector.y);
        roblog('target', 'position', this.archon.position.x, this.archon.position.y);
      }

      if(this.archon.organs.temper.howUncomfortableAmI(mTemp) > this.archon.organs.lizer.howHungryAmI(mTaste)) {
        tempVector.scalarMultiply(this.archon.sensorWidth);
        tempVector.add(this.archon.position);
     
        if(this.archon.uniqueID === 0) {
          roblog('target', 'temp set', tempVector.x, tempVector.y);
        }
        
        this.archon.organs.accel.setTarget(tempVector);
      } else {
        tasteVector.scalarMultiply(this.archon.sensorWidth);
        tasteVector.add(this.archon.position);
        
        if(this.archon.uniqueID === 0) {
          roblog('target', 'taste set', tasteVector.x, tasteVector.y);
        }
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
