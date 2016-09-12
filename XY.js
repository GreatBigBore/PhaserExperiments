/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
  undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

"use strict";

var Rob = Rob || {};

(function(ns) {

ns.XY = function(sourceOrMaybeX, maybeY) {
  if(this instanceof ns.XY) {
    this.set(sourceOrMaybeX, maybeY);
  } else {
    return new ns.XY(sourceOrMaybeX, maybeY);
  }
};

ns.XY.prototype = {
  add: function(a1, a2) { var addend = ns.XY(a1, a2); this.x += addend.x; this.y += addend.y; },
  
  dividedByScalar: function(scalar) { var scratch = ns.XY(this); scratch.scalarDivide(scalar); return scratch; },
  
  equals: function(a1, a2) { var rhs = ns.XY(a1, a2); return this.x === rhs.x && this.y === rhs.y; },
  
  getAngleFrom: function(a1, a2) { var c = ns.XY(a1, a2); return Math.atan2(this.y - c.y, this.x - c.x); },

  getAngleTo: function(a1, a2) { var c = ns.XY(a1, a2); return c.getAngleFrom(this); },
  
  getDistanceTo: function(a1, a2) { return getMagnitude(this.minus(a1, a2)); },
  
  getMagnitude: function() { return getMagnitude(this); },
  
  plus: function(a1, a2) { var scratch = ns.XY(this); scratch.add(a1, a2); return scratch; },
  
  minus: function(a1, a2) { var scratch = ns.XY(this); scratch.subtract(a1, a2); return scratch; },
  
  normalize: function() { var s = this.getMagnitude(); this.x /= s; this.y /= s; },

  reset: function() { this.set(0, 0); },
  
  scalarDivide: function(scalar) { this.x /= scalar; this.y /= scalar; },
  
  scalarMultiply: function(scalar) { this.x *= scalar; this.y *= scalar; },
  
  subtract: function(a1, a2) { var subtrahend = ns.XY(a1, a2); this.x -= subtrahend.x; this.y -= subtrahend.y; },
  
  timesScalar: function(scalar) { var scratch = ns.XY(this); scratch.scalarMultiply(scalar); return scratch; },
  
  X: function(places) { if(places === undefined) { places = 0; } return this.x.toFixed(places); },
  
  Y: function(places) { if(places === undefined) { places = 0; } return this.y.toFixed(places); },

  set: function(sourceOrMaybeX, maybeY) {
    if(sourceOrMaybeX === undefined) {
      this.x = 0; this.y = 0;
    } else {
      if(sourceOrMaybeX.x === undefined) {
        if(maybeY === undefined) {
          if(isNaN(sourceOrMaybeX || !isFinite(sourceOrMaybeX))) {
            // sourceOrMaybeX appears to be a number, an x-coordinate, but
            // maybeY has nothing in it. Tell the caller we hate him
            throw TypeError("Bad argument");
          } else {
            // Single number specified, take it as the value for both
            this.x = sourceOrMaybeX;
            this.y = sourceOrMaybeX;
          }
        } else {
          // Looks like an x/y pair
          this.x = sourceOrMaybeX;
          this.y = maybeY;
        }
      } else {
        // sourceOrMaybeX must be an object with x/y values
        this.x = sourceOrMaybeX.x;
        this.y = sourceOrMaybeX.y;
      }
    }

    return this;
  }
};

ns.XY.fromPolar = function(r, theta) {
  return ns.XY(Math.cos(theta) * r, Math.sin(theta) * r);
};

ns.XY.set = function(target, a1, a2) {
  var scratch = new ns.XY(a1, a2);
  target.x = scratch.x;
  target.y = scratch.y;
};

function getMagnitude(a1, a2) {
  var xy = ns.XY(a1, a2);
  
  return Math.sqrt(Math.pow(xy.x, 2) + Math.pow(xy.y, 2));
}

})(Rob);

if(typeof window === "undefined") {
  module.exports = Rob;
}
