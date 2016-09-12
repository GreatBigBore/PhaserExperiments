/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
  undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global describe, it */

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
  
  plus: function(a1, a2) { var scratch = ns.XY(this); scratch.add(a1, a2); return scratch; },
  
  minus: function(a1, a2) { var scratch = ns.XY(this); scratch.subtract(a1, a2); return scratch; },

  reset: function() { this.set(0, 0); },
  
  scalarDivide: function(scalar) { this.x /= scalar; this.y /= scalar; },
  
  scalarMultiply: function(scalar) { this.x *= scalar; this.y *= scalar; },
  
  subtract: function(a1, a2) { var subtrahend = ns.XY(a1, a2); this.x -= subtrahend.x; this.y -= subtrahend.y; },
  
  timesScalar: function(scalar) { var scratch = ns.XY(this); scratch.scalarMultiply(scalar); return scratch; },

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
  
})(Rob);

if(typeof window === "undefined") {
  // Length must be >= 3 because we should get node, mocha, name of this script
  if(process.argv.length >= 3 && process.argv[1].indexOf('_mocha') !== -1) {
    //var data_driven = require('data-driven');
    var chai = require('chai');
  
    describe('XY', function() {
      describe('Test constructor:', function() {
        function makeBadXY() { Rob.XY('zero'); }
        function xyFromUndefined() { return Rob.XY(); }
        function xyFromScalar() { return Rob.XY(42); }
        function xyFromPair() { return Rob.XY(69, 96); }
        function xyFromXY() { return Rob.XY({ x: 137, y: 3.14 }); }
        function xyFromPolar(r, theta) { return Rob.XY.fromPolar(r, theta); }
        
        it('Should throw TypeError', function() {
          chai.expect(makeBadXY).to.throw(TypeError, 'Bad arg');
        });
        
        it('Should not throw', function() {
          chai.expect(xyFromUndefined).to.not.throw();
          chai.expect(xyFromScalar).to.not.throw();
          chai.expect(xyFromPair).to.not.throw();
          chai.expect(xyFromXY).to.not.throw();
          chai.expect(xyFromPolar).to.not.throw();
        });
        
        it('Should accept undefined', function() { chai.expect(xyFromUndefined()).to.include({ x: 0, y: 0 }); } );
        it('Should accept scalar', function() { chai.expect(xyFromScalar()).to.include({ x: 42, y: 42 }); } );
        it('Should accept pair', function() { chai.expect(xyFromPair()).to.include({ x: 69, y: 96 }); } );
        it('Should accept any x/y object', function() { chai.expect(xyFromXY()).to.include({ x: 137, y: 3.14 }); } );
        it('Should accept polar coordinates', function() {
          
          var r = 17;
          var theta = Math.PI / 4;
          var lo = r / Math.sqrt(2) - 1e-5;
          var hi = r / Math.sqrt(2) + 1e-5;
          var p = Rob.XY.fromPolar(r, theta);
          
          chai.expect(p).to.have.property('x').that.is.within(lo, hi);
          chai.expect(p).to.have.property('y').that.is.within(lo, hi);
        });
      });
      
      describe('Test add, subtract, scalar multiply, scalar divide:', function() {
        var p = Rob.XY();
        
        it('Should add', function() { p.reset(); p.add(137, Math.PI); chai.expect(p).to.include({ x: 137, y: Math.PI }); });
        it('Should add implied vector', function() { p.reset(); p.add(42); chai.expect(p).to.include({ x: 42, y: 42 }); });
        
        it('Should subtract', function() { p.reset(); p.subtract(137, Math.PI); chai.expect(p).to.include({ x: -137, y: -Math.PI }); });
        it('Should subtract implied vector', function() { p.reset(); p.subtract(42); chai.expect(p).to.include({ x: -42, y: -42 }); });

        it('Should multiply', function() { p.set(5, 7); p.scalarMultiply(3); chai.expect(p).to.include({ x: 15, y: 21 }); });
        it('Should divide', function() { p.set(37, 20); p.scalarDivide(2); chai.expect(p).to.include({ x: 18.5, y: 10 }); });
      });
      
      describe('Test plus, minus, times scalar, divided by scalar:', function() {
        var p1 = Rob.XY(-17, 19), p2 = Rob.XY(137, -46);
        
        it('Should plus', function() { chai.expect(p1.plus(p2)).to.include({ x: -17 + 137, y: 19 + -46 }); });
        it('Should plus implied vector', function() { chai.expect(p1.plus(3)).to.include({ x: -14, y: 22 }); });

        it('Should minus', function() { chai.expect(p2.minus(p1)).to.include({ x: 137 - (-17), y: -46 - 19 }); });
        it('Should minus implied vector', function() { chai.expect(p2.minus(3)).to.include({ x: 134, y: -49 }); });

        it('Should times scalar', function() { chai.expect(p1.timesScalar(2)).to.include({ x: -34, y: 38 }); });
        it('Should divided by scalar', function() { chai.expect(p2.dividedByScalar(2)).to.include({ x: 137 / 2, y: -23 }); });
      });
      
      describe('Test geometry', function() {
        var fromP0ToP1 = Math.PI / 4;
        var fromP0ToP2 = 5 * Math.PI / 3;
        var fromP1ToP2 = fromP0ToP2 - fromP0ToP1;
        
        var fromP1ToP0 = -(Math.PI - fromP0ToP1);
        var fromP2ToP0 = -(Math.PI - fromP0ToP2);
        var fromP2ToP1 = -(Math.PI - fromP1ToP2);
        
        var p0 = Rob.XY(), p1 = Rob.XY.fromPolar(19, fromP0ToP1), p2 = Rob.XY.fromPolar(32, fromP0ToP2);
        
        it('Angle from origin to point', function() { chai.expect(p1.getAngleFrom(p0)).to.equal(fromP0ToP1); });
        it('Angle from point to origin', function() { chai.expect(p2.getAngleTo(p0)).to.equal(fromP2ToP0); });

        it('Angle from p1 to origin', function() { chai.expect(p1.getAngleTo(p0)).to.equal(fromP1ToP0); });
        it('Angle from p2 to p1', function() { chai.expect(p2.getAngleTo(p1)).to.equal(fromP2ToP1); });

        it('Angle to p1 from p2', function() { chai.expect(p2.getAngleFrom(p1)).to.equal(fromP2ToP1); });
        it('Angle to p2 from p1', function() { chai.expect(p1.getAngleFrom(p2)).to.equal(fromP2ToP1); });
      });
    });
  } else {
    // Running under node, but not under mocha
    module.exports = Rob.XY;
  }
}
