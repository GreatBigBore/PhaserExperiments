/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game */

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
  
  this.wallAvoidance = Rob.XY();
};

Rob.Locator.prototype = {
  
  calculatePursuitValue: function(value, massRatio, victimIsParasite) {
    var caloriesToBeGained = victimIsParasite ?
      Rob.globals.caloriesGainedPerInjuredParasiteBite : Rob.globals.caloriesGainedPerParasiteBite;

    return value * (
      ( massRatio * caloriesToBeGained * this.archon.parasiteChaseFactor * this.archon.lizer.howHungryAmI() ) /
      ( this.archon.avoidDangerousPreyFactor * (1 + this.archon.injuryFactor * 100) )
    );
  },
  
  ffSense: function(rhs) {
    if(this.archon.uniqueID !== rhs.archon.uniqueID) {
      this.sense('ff', rhs);
    }
  },
  
  getEmergencyFlightPlan: function(predator, vectorToPredator) {
    var a = null;
    var inDangerZone = false;
    
    if(Rob.fuzzyEqual(20, this.archon.position.x, predator.archon.position.x)) {
      inDangerZone = true;
      
      if(Rob.pointInXBounds(this.archon.position) && !this.wallAvoidance.x) {
        a = this.archon.position.x - predator.archon.position.x;
        
        if(a === 0) {
          vectorToPredator.x += (Rob.integerInRange(0, 1) || -1) * 100;
        } else {
          vectorToPredator.x += Math.sign(a) * 100;
        }
      } else {
        this.wallAvoidance.x = Math.abs(this.archon.position.x - game.width / 2) > game.width / 4;

        if(this.wallAvoidance.x) {
          vectorToPredator.x -= (this.archon.position.x - game.width / 2) * 100;
        }
      }
    }
    
    if(Rob.fuzzyEqual(20, this.archon.position.y, predator.archon.position.y)) {
      inDangerZone = true;
      if(Rob.pointInYBounds(this.archon.position) && !this.wallAvoidance.y) {
        a = this.archon.position.y - predator.archon.position.y;
        
        if(a === 0) {
          vectorToPredator.y += (Rob.integerInRange(0, 1) || -1) * 100;
        } else {
          vectorToPredator.y += Math.sign(a) * 100;
        }
      } else {
        this.wallAvoidance.y = Math.abs(this.archon.position.y - game.height / 2) > game.height / 4;

        if(this.wallAvoidance.y) {
          vectorToPredator.y -= (this.archon.position.y - game.height / 2) * 100;
        }
      }
    }
    
    return inDangerZone;
    
  },
  
  getFlightPlan: function(massRatioHisToMine, him) {
    var relatedness = Rob.globals.archonia.familyTree.getDegreeOfRelatedness(him.archon.uniqueID, this.archon.uniqueID);

    // If I'm a not-too-injured parasite, I am dangerous
    var iAmDangerous = (
      this.archon.isParasite && (this.archon.injuryFactor < him.archon.injuryFactorThreshold) && !this.archon.isDisabled
    );
    
    // If he's a not-too-injured parasite, he is dangerous
    var heIsDangerous = (
      him.archon.isParasite && (him.archon.injuryFactor < this.archon.injuryFactorThreshold) && !him.archon.isDisabled
    );

    // If I'm a non-parasite, I should avoid all parasites, their injuries notwithstanding
    // If he's a too-big non-parasite, I should avoid him
    // If I'm a too-injured parasite, I should avoid everyone
    //    (non-parasites can still injure me, and other parasites will eat me)
    var iShouldAvoid = (
      (him.archon.isParasite && !this.archon.isParasite) ||
      (!him.archon.isParasite && massRatioHisToMine > this.archon.avoidDangerousPreyFactor) ||
      !iAmDangerous
    );
    
    // If I'm not dangerous, and he's not dangerous, we can browse together in peace
    // If he's dangerous, and I'm dangerous, we can prey together in peace
    // If we're too closely related, we should ignore each other
    // JS doesn't have an xor?!?!
    var iShouldIgnore = (iAmDangerous && heIsDangerous) || (!iAmDangerous && !heIsDangerous) || relatedness <= 3;

    // If avoidance and ignorance have both been ruled out, he's prey
    var iShouldPursue = !iShouldAvoid && !iShouldIgnore;
    
    // If he's a parasite, he will get something from me if I'm not a parasite,
    // even if I injure him in the encounter. If he's a parasite and I'm disabled,
    // he will get something from me, again, even if I injure him
    var iWillBeParasitized = (this.archon.isDisabled || !this.archon.isParasite) && him.archon.isParasite;
    
    // Whether I get an injury or not, if I'm not disabled, I get some calories
    var iWillParasitize = this.archon.isParasite && !this.archon.isDisabled && (!him.archon.isParasite || him.archon.isDisabled);
    
    var iWillBeInjured = (
      !iWillBeParasitized &&      // Being injured and being parasitized are mutually exclusive
      this.archon.isParasite &&   // Only parasites can be injured; non-parasites are parasitized
      !him.archon.isParasite &&   // Only non-parasites can injure; parasites parasitize
      massRatioHisToMine > 1
    );
    
    // Parasites don't injure each other. I will injure him if he's smaller than I
    // am, even if he gets some calories from me
    var iWillInjure = !this.archon.isParasite && him.archon.isParasite && massRatioHisToMine < 1;
    
    return {
      iAmDangerous: iAmDangerous, heIsDangerous: heIsDangerous,
      iShouldPursue: iShouldPursue, iShouldIgnore: iShouldIgnore, iShouldAvoid: iShouldAvoid,
      iWillBeInjured: iWillBeInjured, iWillInjure: iWillInjure,
      iWillBeParasitized: iWillBeParasitized, iWillParasitize: iWillParasitize
    };
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
    
    this.wallAvoidance.reset();
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
    
    var value = 2 - Math.min(distance / radius, 1);
    
    var addThisSensee = true;
    
    // Process feeding / fleeing situations
    
    if(sense === 'ff') {
      var massRatio = sensee.archon.lizer.getMass() / this.archon.lizer.getMass();

      var fp = this.getFlightPlan(massRatio, sensee);
      
      if(fp.iShouldIgnore) {

        // If I can ignore him, then don't add a vector for him.
        addThisSensee = false;

      } else if(fp.iShouldAvoid) {

        value *= this.archon.parasiteFlightFactor;
        
        if(!this.getEmergencyFlightPlan(sensee, relativePosition)) {
          // If we're out of the predator's range, then it's not
          // quite as much of an emergency, so no flight plan will
          // be made. In that case, we just need to point our vector
          // safely away from the predator
          value *= -1;
        }

      } else if(fp.iShouldPursue) {

        value = this.calculatePursuitValue(value, massRatio, sensee.archon.isParasite);

      }
    }

    if(addThisSensee) {
      relativePosition.normalize();
      relativePosition.scalarMultiply(value);
    
      t.vector.add(relativePosition);
      t.hitCount++;
  
      var drawDebugLines = false;
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
