/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

"use strict";

var Rob = Rob || {};
var Archonia = Archonia || {};

Rob.Range = require('./Range.js');

(function(Rob) {

Archonia = (function() {
  var worldTemps = new Rob.Range(-1000, 1000);

  var archonDefaultSoftTemps = new Rob.Range(-500, 500);
  var archonDefaultHardTempsLo = new Rob.Range(worldTemps.lo, archonDefaultSoftTemps.lo);
  var archonDefaultHardTempsHi = new Rob.Range(archonDefaultSoftTemps.hi, worldTemps.hi);

  // Cost in spud/sec when you're at the limit of the default body temp range
  var spudPerSoftTemp = 1 / archonDefaultSoftTemps.getRadius();
  var chugPerHardTempHi = 1 / archonDefaultHardTempsHi.getRadius();
  var slugPerHardTempLo = 1 / archonDefaultHardTempsLo.getRadius();

  return {
    worldTemps: worldTemps,
    archonDefaultSoftTemps: archonDefaultSoftTemps,
    archonDefaultHardTempsLo: archonDefaultHardTempsLo,
    archonDefaultHardTempsHi: archonDefaultHardTempsHi,
    spudPerSoftTemp: spudPerSoftTemp,
    chugPerHardTempHi: chugPerHardTempHi,
    slugPerHardTempLo: slugPerHardTempLo
  };
})();
  
Rob.Budget = function() {
};

Rob.Budget.prototype = {

  getCost: function(currentTemp) {
    var a = 0, b = 0;
    var spudCost = 0, chugCost = 0, slugCost = 0;
    
    if(currentTemp > this.optimalTemp) {
      
      if(currentTemp > this.optimalTempHi) {
        
        a = this.hardTempsHi.getSize();
        b = Archonia.archonDefaultHardTempsHi.getSize();
        
        chugCost = (currentTemp - this.optimalTempHi) * (a / b) * Archonia.chugPerHardTempHi;
        
        a = this.softTemps.getSize();
        b = Archonia.archonDefaultSoftTemps.getSize();
        
        spudCost = (this.optimalTempHi - this.optimalTemp) * (a / b) * Archonia.spudPerSoftTemp;
        
      } else {
        
        a = this.softTemps.getSize();
        b = Archonia.archonDefaultSoftTemps.getSize();
        
        spudCost = (currentTemp - this.optimalTemp) * (a / b) * Archonia.spudPerSoftTemp;
        
      }
    } else if(currentTemp < this.optimalTemp) {
      
      if(currentTemp < this.optimalTempLo) {
        
        a = this.hardTempsLo.getSize();
        b = Archonia.archonDefaultHardTempsLo.getSize();
        
        slugCost = (this.optimalTempLo - currentTemp) * (a / b) * Archonia.slugPerHardTempLo;
        
        a = this.softTemps.getSize();
        b = Archonia.archonDefaultSoftTemps.getSize();
        
        spudCost = (this.optimalTemp - this.optimalTempLo) * (a / b) * Archonia.spudPerSoftTemp;
        
      } else {
        
        a = this.softTemps.getSize();
        b = Archonia.archonDefaultSoftTemps.getSize();
        
        spudCost = (this.optimalTemp - currentTemp) * (a / b) * Archonia.spudPerSoftTemp;
        
      }
      
    }
    
    console.log(
      currentTemp, slugCost.toFixed(4), spudCost.toFixed(4), chugCost.toFixed(4), (slugCost + spudCost + chugCost).toFixed(4)
    );
    
    return slugCost + spudCost + chugCost;
  },
  
  launch: function(archon) {
    this.hardTempsHi = new Rob.Range(archon.optimalHiTemp, Archonia.worldTemps.hi);
    this.hardTempsLo = new Rob.Range(Archonia.worldTemps.lo, archon.optimalLoTemp);
    this.softTemps = new Rob.Range(archon.optimalLoTemp, archon.optimalHiTemp);
    
    this.optimalTempLo = archon.optimalLoTemp;
    this.optimalTempHi = archon.optimalHiTemp;
    this.optimalTemp = archon.optimalTemp;
  },

  mapNominalRangeToMine: function() {
  }
};

})(Rob);

if(typeof window === "undefined") {
  
  var getCurve = function(temp, a, b, c) {
    temp /= 1000; a /= 1000;  b /= 1000; c /= 1000;
    
    var f = -Math.pow(temp - b, 2);
    var g = 2 * Math.pow(c, 2);
    
    //console.log(temp, a.toFixed(4), b.toFixed(4), c.toFixed(4), f.toFixed(4), g.toFixed(4));
    
    return a * Math.pow(Math.E, f / g);
  };

  var archons = [
    { optimalHiTemp: 600, optimalLoTemp: 400, optimalTemp: 500 },
    { optimalHiTemp: 1000, optimalLoTemp: -1000, optimalTemp: 0 },
    { optimalHiTemp: 500, optimalLoTemp: -500, optimalTemp: 0 },
    { optimalHiTemp: 900, optimalLoTemp: 700, optimalTemp: 800 },
    { optimalHiTemp: -300, optimalLoTemp: -800, optimalTemp: -675 }
  ];
  
  for(var j = 0; j < archons.length; j++) {
    var archon = archons[j];
    
    console.log();
    console.log(archon);
    
    var max = Math.max(Math.abs(archon.optimalHiTemp), Math.abs(archon.optimalLoTemp));
    
    var center = (archon.optimalHiTemp - archon.optimalLoTemp) / 2 + archon.optimalLoTemp;
    var width = Math.abs(archon.optimalHiTemp - archon.optimalLoTemp);
    
    var b = new Rob.Budget();
    b.launch(archon);

    var sep = "";
    var out = "";
    for(var i = -1000; i <= 1000; i+= 25) {
      out += sep;

      if(i % 500 === 0) {
        out += "\n";
      } 

      out += i.toString() + ": ";
      
      out += (getCurve(i, max, center, width)).toFixed(4);
      sep = ", ";
    }
    
    console.log(out);
  }
}