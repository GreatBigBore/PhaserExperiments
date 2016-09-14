/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

"use strict";

var Rob = Rob || {};

if(typeof window === "undefined") {
  Rob = require('./XY.js');
}

(function(Rob) {

Rob.Locator = function() {
  this.trackers = {
    taste: { vector: Rob.XY(), hitCount: 0 }
  };
};

Rob.Locator.prototype = {

  getSenseVector: function(sense) {
    var t = this.trackers[sense];
    
    if(t.hitCount !== 0) {
      t.vector.scalarDivide(t.hitCount);
    }
    
    return t.vector;
  },
  
  init: function() {},
  
  launch: function() {},
  
  tick: function(/*frameCount*/) {},
  
  ready: function(archon) {
    this.archon = archon;
    this.organs = Object.assign({}, archon.organs);

    // See value calculation in sense(); the highest
    // value food is that closest to us
    this.foodDistanceRange = Rob.Range(archon.sensor.width / 2, 1);
  },
  
  reset: function() {
    for(var i in this.trackers) {
      var t = this.trackers[i];

      t.vector.reset();
      t.hitCount = 0;
    }
  },

  sense: function(sense, sensee) {
    var t = this.trackers[sense];
    
    var radius = this.archon.sensor.width / 2;
    var relativePosition = Rob.XY(sensee).minus(this.archon.sensor);
    var distance = relativePosition.getMagnitude();
    var value = 2 - (distance / radius);

    relativePosition.normalize();
    relativePosition.scalarMultiply(value);
    
    t.vector.add(relativePosition);
    t.hitCount++;
  
    var drawDebugLines = false;
    if(drawDebugLines) {
      var color = null;
      switch(sense) {
        case 'taste': color = 'cyan'; break;
        default: throw "Bad sense '" + sense + "'";
      }
    }
  },
  
  taste: function(food) {
    this.sense('taste', food);
  }
  
};

})(Rob);

if(typeof window === "undefined") {
  module.exports = Rob;
}