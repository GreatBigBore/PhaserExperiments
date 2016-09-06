/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global Rob */

"use strict";

Rob.Range = function(lo, hi) {
  var self = {
    lo: 0, hi: 0,

    // The reason for this class: scaling a point
    // in my range to a point in a different range
    convertPoint: function(thePointOnHisMap, hisRange) {

      var hisCenter = hisRange.getCenter();

      var thePointOnMyMap = (
        (thePointOnHisMap - hisCenter) * (self.getSize() / hisRange.getSize()) +
        self.getCenter()
      );

      return thePointOnMyMap;
    },

    getCenter: function() {
      var base = (self.lo < self.hi) ? self.lo : self.hi;
      return base + self.getSize() / 2;
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
