/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

"use strict";

var Rob = Rob || {};
var Archonia = Archonia || {};

Rob.Range = require('./Range.js');

(function(Rob) {

Archonia = (function() {
  var worldTempRange = new Rob.Range(-1000, 1000);
  var archonDefaultTempRange = new Rob.Range(-200, 200);

  var archonDefaultTempRangeLo = new Rob.Range(worldTempRange.lo, archonDefaultTempRange.lo);
  var archonDefaultTempRangeHi = new Rob.Range(archonDefaultTempRange.hi, worldTempRange.hi);

  // Cost in calories/sec when you're at the limit of the default body temp range
  var costPerTempRadius = 1;
  var baseCostPerSoftDegree = costPerTempRadius / archonDefaultTempRange.getRadius();
  var baseCostPerHardDegree = baseCostPerSoftDegree * 0.5;

  return {
    worldTempRange: worldTempRange,
    archonDefaultTempRange: archonDefaultTempRange,
    baseCostPerSoftDegree: baseCostPerSoftDegree,
    baseCostPerHardDegree: baseCostPerHardDegree,
    archonDefaultTempRangeLo: archonDefaultTempRangeLo,
    archonDefaultTempRangeHi: archonDefaultTempRangeHi
  };
})();
  
Rob.Budget = function() {
};

Rob.Budget.prototype = {

  getCost: function(currentTemp) {
    var softTemp = 0;
    var hardTemp = 0;
    var toHardRange = null;
    var fromHardRange = null;
    
    if(currentTemp > this.optimalTemp) {
      
      if(currentTemp > this.optimalTempHi) {
        fromHardRange = Archonia.archonDefaultTempRangeHi;
        toHardRange = this.hardRangeHi;
        hardTemp = currentTemp - this.optimalTempHi;
        softTemp = this.optimalTempHi - this.optimalTemp;
      } else {
        softTemp = this.optimalTempHi - currentTemp;
      }
      
    } else if(currentTemp < this.optimalTemp) {
      
      if(currentTemp < this.optimalTempLo) {
        fromHardRange = Archonia.archonDefaultTempRangeLo;
        toHardRange = this.hardRangeLo;
        hardTemp = currentTemp - this.optimalTempLo;
        softTemp = this.optimalTempLo - this.optimalTemp;
      } else {
        softTemp = currentTemp - this.optimalTempLo;
      }
      
    }
    
    var scaledSoft = Math.abs(this.softTempRange.convertPoint(currentTemp, Archonia.archonDefaultTempRange));

    var scaledHard = 0;
    if(hardTemp !== 0) {
      scaledHard = Math.abs(toHardRange.convertPoint(currentTemp, fromHardRange));
    }
    
    console.log(currentTemp, this.optimalTempLo, this.optimalTemp, this.optimalTempHi, scaledSoft.toFixed(4), scaledHard.toFixed(4));
    return scaledSoft * Archonia.baseCostPerSoftDegree + scaledHard * Archonia.baseCostPerHardDegree;
  },
  
  launch: function(archon) {
    this.hardRangeHi = new Rob.Range(archon.optimalHiTemp, Archonia.worldTempRange.hi);
    this.hardRangeLo = new Rob.Range(Archonia.worldTempRange.lo, archon.optimalLoTemp);
    this.softTempRange = new Rob.Range(archon.optimalLoTemp, archon.optimalHiTemp);
    
    this.optimalTempLo = archon.optimalLoTemp;
    this.optimalTempHi = archon.optimalHiTemp;
    this.optimalTemp = archon.optimalTemp;
  },

  mapNominalRangeToMine: function() {
  }
};

})(Rob);

if(typeof window === "undefined") {

  var archons = [
    { optimalHiTemp: 200, optimalLoTemp: -200, optimalTemp: 0 },
    { optimalHiTemp: 1000, optimalLoTemp: -1000, optimalTemp: 0 },
    { optimalHiTemp: 500, optimalLoTemp: -500, optimalTemp: 0 },
    { optimalHiTemp: 900, optimalLoTemp: 700, optimalTemp: 800 },
    { optimalHiTemp: 950, optimalLoTemp: 900, optimalTemp: 925 }
  ];
  
  for(var j = 0; j < archons.length; j++) {
    //archon.optimalTemp = (Math.random() * 2000) - 1000;
    //archon.optimalLoTemp = Math.random() * (Math.abs(archon.optimalTemp - 1000)) - 1000;
    //archon.optimalHiTemp = 1000 - Math.random() * (Math.abs(archon.optimalTemp - 1000));
    
    var archon = archons[j];
    
    console.log();
    console.log(archon);

    var b = new Rob.Budget();
    b.launch(archon);

    var out = "";
    var sep = "";
    for(var i = -10; i <= 10; i++) {
      var t = (i * 100);
      var c = b.getCost(t).toFixed(2);
      
      if(i % 5 === 0) { out += "\n"; }
      
      out += sep + "(" + t + ": " + c + ")";
      sep = ", ";
    }

    console.log(out);
  }
}