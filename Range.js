/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

"use strict";

var Rob = Rob || {};

if(typeof window === "undefined") {
  Rob = require('./Rob.js');
}

(function(Rob) {

Rob.Range = function(lo, hi) {
  this.lo = lo; this.hi = hi;
  
  this.radialRange = null;
};

Rob.Range.prototype = {
  // The reason for this class: scaling a point
  // in my range to a point in a different range
  convertPoint: function(thePointOnHisMap, hisRange) {

    // This is a signed value, indicating both his distance
    // and direction from his center; if it's a negative
    // value, then he's to the negative side of his center
    var hisDistanceFromCenter = thePointOnHisMap - hisRange.getCenter();

    // But if he's a hi to lo range, then we need to flip
    // the sign, unless, of course, we both are
    var signAdjust = this.getSign() * hisRange.getSign();

    var asAPercentage = signAdjust * hisDistanceFromCenter / hisRange.getSize();
    var relativeToMyScale = this.getSize() * asAPercentage;
    var absoluteOnMyScale = this.getCenter() + relativeToMyScale;

    return absoluteOnMyScale;
  },

  getCenter: function() {
    var base = (this.lo < this.hi) ? this.lo : this.hi;
    return base + this.getSize() / 2;
  },
  
  getRadius: function() {
    return this.radial().getSize();
  },

  getSign: function() {
    return Math.sign(this.hi - this.lo) || 1;
  },

  getSize: function() {
    return Math.abs(this.hi - this.lo);
  },
  
  radial: function() {
    if(this.radialRange === null) {
      this.radialRange = new Rob.Range(0, Math.abs(this.hi - this.lo) / 2);
    }
    
    return this.radialRange;
  },

  set: function(lo, hi) {
    this.lo = lo;
    this.hi = hi;
    return this;
  }
};

  
})(Rob);

if(typeof window === "undefined") {
  module.exports = Rob.Range;
}
