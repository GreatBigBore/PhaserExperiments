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

      if(thePointOnHisMap === 0) {
        return hisRange.hi;
      } else {
        //console.log('his point: ', thePointOnHisMap);
        //console.log('his lo/hi/size: ', hisRange.lo, hisRange.hi, hisRange.getSize());
        //console.log('my lo/hi/size: ', self.lo, self.hi, self.getSize());

        var asAPercentage = (hisRange.lo - thePointOnHisMap) / hisRange.getSize();
        var relativeToMyScale = self.getSize() * asAPercentage;
        var signAdjust = self.getSign() * hisRange.getSign();
        var absoluteOnMyScale = self.lo - relativeToMyScale * signAdjust;

        //console.log('%: ', asAPercentage);
        //console.log('scaled to me: ', relativeToMyScale);
        //console.log('my point:', absoluteOnMyScale);

        return absoluteOnMyScale;
      }
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
