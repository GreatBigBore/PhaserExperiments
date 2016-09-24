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

  this.frameCount = 0;
  
  this.wallAvoidance = Rob.XY();
  this.jinkTime = 0;
  this.lastPredatorDistance = Number.MAX_VALUE;
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

  computerizeAngle: function(robizedAngle) {
    while(robizedAngle > 2 * Math.PI) {
      robizedAngle -= 2 * Math.PI;
    }
  
    var a = (robizedAngle > Math.PI) ? 2 * Math.PI - robizedAngle : -robizedAngle;
  
    return a;
  },
  
  ffSense: function(rhs) {
    if(this.archon.uniqueID !== rhs.archon.uniqueID) {
      this.sense('ff', rhs);
    }
  },
  
  getAvoidanceFlightPlan: function(predator, vectorToPredator) {
    var inDanger = false;
    
    var rrc = 50;
    if(this.archon.position.x < 25) { this.wallAvoidance.x = rrc; } else if(this.archon.position.x > game.width - 25) { this.wallAvoidance.x = rrc - game.width; }
    if(this.archon.position.y < 25) { this.wallAvoidance.y = rrc; } else if(this.archon.position.y > game.height - 25) { this.wallAvoidance.y = rrc - game.height; }
  
    if(this.wallAvoidance.x && this.archon.position.x >= rrc && this.archon.position.x <= game.width - rrc) { this.wallAvoidance.x = false; }
    if(this.wallAvoidance.y && this.archon.position.y >= rrc && this.archon.position.y <= game.height - rrc) { this.wallAvoidance.y = false; }
  
    if(this.wallAvoidance.x) { vectorToPredator.x = this.wallAvoidance.x; inDanger = true; }
    if(this.wallAvoidance.y) { vectorToPredator.y = this.wallAvoidance.y; inDanger = true; }
    
    if(this.wallAvoidance.x || this.wallAvoidance.y) {
      vectorToPredator.scalarMultiply(-100);
    }

    var currentDistanceToPredator = this.archon.position.getDistanceTo(predator.archon.position);
    if(!inDanger && (this.frameCount > this.jinkTime)) {
      inDanger = true;
    
      this.jinkTime = this.frameCount + 30;
      this.lastPredatorDistance = currentDistanceToPredator;

      var theta = this.archon.position.getAngleTo(predator.archon.position);
    
      var adjust = null;
      var direction = game.rnd.integerInRange(0, 1) || -1;
    
      if(direction > 0) {
        adjust = game.rnd.realInRange(-Math.PI / 2, -Math.PI / 4);
      } else {
        adjust = game.rnd.realInRange(Math.PI / 4, Math.PI / 2);
      }
    
      var robizedAngle = this.robizeAngle(theta + adjust + Math.PI);
    
      var computerizedAngle = this.computerizeAngle(robizedAngle);

      vectorToPredator.set(Rob.XY.fromPolar(this.archon.sensorWidth * 100, computerizedAngle));
    }
    
    if(!inDanger) { this.lastPredatorDistance = Number.MAX_VALUE; }

    return false;
  },
  
  getStandardFlightPlan: function(massRatioHisToMine, theOtherGuy) {
    var him = theOtherGuy.archon, he = him;
    var me = this.archon;
    
    var iShouldAvoid = false;
    var iShouldIgnore = false;
    var iShouldPursue = false;
    var iWillBeInjured = false;
    var iWillBeParasitized = false;
    var iWillInjure = false;
    var iWillParasitize = false;
    var done = false;
    
    var closeRelatives = Rob.globals.archonia.familyTree.getDegreeOfRelatedness(him.uniqueID, me.uniqueID) <= 3;
    var bothGrazers = !me.isParasite && !him.isParasite;

    if(closeRelatives || bothGrazers) { iShouldIgnore = true; done = true; }
    if(!done && he.isParasite && !me.isParasite) { iShouldAvoid = true; done = true; }
    if(!done && me.isParasite && he.isDisabled) { iShouldPursue = true; done = true; }
    if(!done && me.isParasite && he.isParasite) { iShouldIgnore = true; done = true; }
    if(!done && me.isParasite && massRatioHisToMine >= 1) { iShouldAvoid = true; done = true; }
    if(!done && me.isParasite && massRatioHisToMine <= 1) { iShouldPursue = true; done = true; }

    if(!closeRelatives) {
      if(he.isParasite && !he.isDisabled && (!me.isParasite || me.isDisabled)) { iWillBeParasitized = true; }
      if(me.isParasite && !me.isDisabled && (!he.isParasite || he.isDisabled)) { iWillParasitize = true; }

      if(!he.isParasite && me.isParasite && !me.isDisabled && massRatioHisToMine > 1) { iWillBeInjured = true; }
      if(!me.isParasite && he.isParasite && !he.isDisabled && massRatioHisToMine < 1) { iWillInjure = true; }
    }
    
    return {
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

  robizeAngle: function(computerizedAngle) {
    var a = (computerizedAngle < 0) ? -computerizedAngle : 2 * Math.PI - computerizedAngle;
  
    while(a < 2 * Math.PI) {
      a += 2 * Math.PI;
    }
  
    return a;
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

      var fp = this.getStandardFlightPlan(massRatio, sensee);
      
      if(fp.iShouldIgnore) {

        // If I can ignore him, then don't add a vector for him.
        addThisSensee = false;

      } else if(fp.iShouldAvoid) {

        value *= this.archon.parasiteFlightFactor;
        
        if(!this.getAvoidanceFlightPlan(sensee, relativePosition)) {
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
  },
  
  tick: function(frameCount) {
    this.frameCount = frameCount;
  }
  
};

})(Rob);

if(typeof window === "undefined") {
  module.exports = Rob;
}
