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
  
  makeFlightPlan: function(predator, vectorToPredator) {
    var a = null;
    
    if(Rob.fuzzyEqual(20, this.archon.position.x, predator.archon.position.x)) {
      if(Rob.pointInXBounds(this.archon.position)) {
        a = this.archon.position.x - predator.archon.position.x;
        
        if(a === 0) {
          vectorToPredator.x += (Rob.integerInRange(0, 1) || -1) * 100;
        } else {
          vectorToPredator.x += Math.sign(a) * 100;
        }
      } else {
        vectorToPredator.x -= Rob.pointXBoundsSign(this.archon.position) * 100;
      }
    }
    
    if(Rob.fuzzyEqual(20, this.archon.position.y, predator.archon.position.y)) {
      if(Rob.pointInYBounds(this.archon.position)) {
        a = this.archon.position.y - predator.archon.position.y;
        
        if(a === 0) {
          vectorToPredator.y += (Rob.integerInRange(0, 1) || -1) * 100;
        } else {
          vectorToPredator.y += Math.sign(a) * 100;
        }
      } else {
        vectorToPredator.y -= Rob.pointYBoundsSign(this.archon.position) * 100;
      }
    }
    
  },
  
  reset: function() {
    for(var i in this.trackers) {
      var t = this.trackers[i];

      t.vector.reset();
      t.hitCount = 0;
    }
  },

  sense: function(sense, sensee) {
    var a = null;
    var t = this.trackers.taste;
    var radius = this.archon.sensorRadius;
    var relativePosition = Rob.XY(sensee).minus(this.archon.position);
    var distance = relativePosition.getMagnitude();
    
    var value = 2 - Math.min(distance / radius, 1);
    
    var addThisSensee = true;
    
    if(sense === 'ff') {
      // Close relatives don't eat each other
      // Don't eat grandparents, parents, or siblings, neices, nephews, uncles, aunts.
      // Cousins are fair game, and everyone else
      if(Rob.globals.archonia.familyTree.getDegreeOfRelatedness(sensee.archon.uniqueID, this.archon.uniqueID) >= 3) {

        if(sensee.archon.isParasite) {      // He's a parasite
          if(!this.archon.isParasite) {     // I'm not
            value *= this.archon.parasiteFlightFactor;
            this.makeFlightPlan(sensee, relativePosition);
          } else {                        // I'm a parasite too; ignore him
            addThisSensee = false;
          }
        } else {                          // He's not a parasite
          if(this.archon.isParasite) {      // I am
            // He's not worth much to me if
            // I'm surrounded by manna (which
            // doesn't flee), but he is worth something
            value *= this.archon.parasiteChaseFactor * Rob.globals.caloriesGainedPerParasiteBite;
          } else {                        // I'm also not a parasite; ignore him
            addThisSensee = false;
          }
        }
      } else {
        addThisSensee = false;            // Too closely related to eat each other
      }
    }

    if(addThisSensee) {
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
