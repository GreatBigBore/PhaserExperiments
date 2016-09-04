/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global Rob */

"use strict";

Rob.Range = function(lo, hi) {
  var self = {
    lo: 0, hi: 0,

    // The reason for this class: scaling a point
    // in my range to a point in a different range
    convertPoint: function(point, theOtherGuy) {
      var hisRange = theOtherGuy.getRange();
      var percentage = point / self.getSize();
      return hisRange * percentage;
    },

    getCenter: function() {
      return self.getSize() / 2;
    },

    getSize: function() {
      return self.hi - self.lo;
    },

    set: function(lo, hi) {
      this.lo = lo;
      this.hi = hi;
    }
  };

  return self.set(lo, hi);
};
