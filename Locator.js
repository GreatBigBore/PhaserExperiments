/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

"use strict";

var Rob = Rob || {};

if(typeof window === "undefined") {
  Rob = require('./XY.js');
}

(function(Rob) {

Rob.Locator = function(archon) {
  this.archon = archon;
  
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
