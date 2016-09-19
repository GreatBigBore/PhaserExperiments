/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

"use strict";

var Rob = Rob || {};

if(typeof window === "undefined") {
  var range = require('./Range.js');
  var xy = require('./XY.js');
  
  Rob = Object.assign(Rob, range, xy);
}

(function(Rob) {

Rob.Locator = function() {
  this.trackers = {
    taste: { vector: Rob.XY(), hitCount: 0 }
  };
};

Rob.Locator.prototype = {
  
  ffSense: function(rhs) {
    if(this.archon.uniqueID !== rhs.archon.uniqueID) {
      this.sense('ff', rhs);
    }
  },

  getSenseVector: function(sense) {
    var t = this.trackers[sense];

    if(t.hitCount !== 0) {
      t.vector.scalarDivide(t.hitCount);
    }
    
    return t.vector;
  },
  
  launch: function(archon) {
    this.archon = archon;

    // We don't use this; the mover does, after it
    // gets our vector. The highest value food is that closest to us
    this.foodDistanceRange = new Rob.Range(1, 2);
  },
  
  reset: function() {
    for(var i in this.trackers) {
      var t = this.trackers[i];

      t.vector.reset();
      t.hitCount = 0;
    }
  },

  sense: function(sense, sensee) {
    var t = this.trackers.taste;
    var radius = this.archon.sensorRadius;
    var relativePosition = Rob.XY(sensee).minus(this.archon.position);
    var distance = relativePosition.getMagnitude();
    
    var value = 2 - (distance / radius);
    
    if(sense === 'ff') {
      // If I'm being pursued, the vector needs to point away
      // from the pursuer. We'll let the genes decide how
      // important flight is in relation to our own hunger
      if(this.archon.lizer.getMass() < sensee.archon.lizer.getMass()) {
        this.fleeing = true;
        value *= -1 * this.archon.parasiteFlightFactor;
      } else {
        value *= this.archon.parasiteChaseFactor;
      }
    }

    relativePosition.normalize();
    relativePosition.scalarMultiply(value);
    
    t.vector.add(relativePosition);
    t.hitCount++;
  
    var drawDebugLines = true;
    if(drawDebugLines) {
      var color = null;
      switch(sense) {
        case 'taste': color = 'cyan'; break;
        case 'ff': color = 'blue'; break;
        default: throw "Bad sense '" + sense + "'";
      }
      
      if(color === 'blue') {
        Rob.db.draw(this.archon.position, relativePosition.plus(this.archon.position), color, 1);
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
