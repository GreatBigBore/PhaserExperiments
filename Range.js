/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

"use strict";

var Rob = Rob || {};

Rob.Range = function(lo, hi) {
  var self = {
    lo: 0, hi: 0,

    // The reason for this class: scaling a point
    // in my range to a point in a different range
    convertPoint: function(thePointOnHisMap, hisRange) {

      // This is a signed value, indicating both his distance
      // and direction from his center; if it's a negative
      // value, then he's to the negative side of his center
      var hisDistanceFromCenter = thePointOnHisMap - hisRange.getCenter();

      // But if he's a hi to lo range, then we need to flip
      // the sign, unless, of course, we both are
      var signAdjust = self.getSign() * hisRange.getSign();

      var asAPercentage = signAdjust * hisDistanceFromCenter / hisRange.getSize();
      var relativeToMyScale = self.getSize() * asAPercentage;
      var absoluteOnMyScale = self.getCenter() + relativeToMyScale;

      return absoluteOnMyScale;
    },

    getCenter: function() {
      var base = (self.lo < self.hi) ? self.lo : self.hi;
      return base + self.getSize() / 2;
    },

    getSign: function() {
      return Math.sign(self.hi - self.lo) || 1;
    },

    getSize: function() {
      return Math.abs(self.hi - self.lo);
    },

    set: function(lo, hi) {
      this.lo = lo;
      this.hi = hi;
      return this;
    }
  };

  return self.set(lo, hi);
};

if(typeof window === "undefined") {
  exports.Range = Rob.Range;
}
