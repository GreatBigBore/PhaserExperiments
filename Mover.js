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
    this.feeding = false;
  },
  
  processMannaVector: function(tasteVector, finalVector) {
    tasteVector.scalarMultiply(this.archon.sensorWidth);
    tasteVector.add(this.archon.position);
    
    this.feeding = true;
    finalVector.set(tasteVector);
  },
  
  processTempVector: function(tempVector, finalVector) {
    tempVector.scalarMultiply(this.archon.sensorWidth);
    
    // If our genes allow it, slow down when we're close to our
    // optimal temp, so we don't bounce up and down so much
    var targetTemp = Rob.getTemperature(tempVector.plus(this.archon.position));
    if(targetTemp > this.archon.optimalLoTemp && targetTemp < this.archon.optimalHiTemp) {
      tempVector.scalarMultiply(this.archon.tempRangeDamping);
    }
    
    tempVector.add(this.archon.position);
    
    this.feeding = false;
    finalVector.set(tempVector);
  },
  
  tick: function(frameCount) {
    if(!this.archon.stopped && frameCount > this.noNewTargetUntil) {
      var m = 0, mTemp = 0, mTaste = 0;
      
      var tempVector = this.getTempVector();
      var tasteVector = this.getTasteVector();

      m = tasteVector.getMagnitude();
      if(m > 0) {
        mTaste = Rob.globals.zeroToOneRange.convertPoint(m, this.archon.locator.foodDistanceRange);
        tasteVector.scaleTo(mTaste);
      }
      
      m = tempVector.getMagnitude();
      if(m > 0) {
        mTemp = Rob.globals.zeroToOneRange.convertPoint(m, this.archon.temper.tempRange);
        tempVector.scaleTo(mTemp);
      }

      var vectorsToCompare = [];
      vectorsToCompare.push({ name: 'processTempVector', v: tempVector, value: this.archon.temper.howUncomfortableAmI(mTemp) });
      vectorsToCompare.push({ name: 'processMannaVector', v: tasteVector, value: this.archon.lizer.howHungryAmI(mTaste) });

      var getWinner = function() {
        var highestValue = null, vName = null, winner = null;
        for(var i = 0; i < vectorsToCompare.length; i++) {
          var v = vectorsToCompare[i];
          
          if(highestValue === null || Math.abs(v.value) > Math.abs(highestValue)) {
            highestValue = v.value;
            winner = i;
          }
        }
        
        return winner;
      };
      
      var finalVector = Rob.XY();
      var winner = vectorsToCompare[getWinner()];
      
      this[winner.name](winner.v, finalVector);

      this.noNewTargetUntil = frameCount + this.archon.targetChangeDelay;

      if(Rob.pointInBounds(finalVector)) {
        this.jitterReductionActive = false;
      } else {
        if(!this.jitterReductionActive) {
          // Hopefully this will reduce the jitter at the edges
          this.noNewTargetUntil += this.archon.targetChangeDelay / 2;
          this.jitterReductionActive = true;
        }
      }

      this.archon.accel.setTarget(finalVector);
      this.archon.locator.reset();
    }
  }
  
};

})(Rob);

if(typeof window === "undefined") {
  module.exports = Rob;
}
