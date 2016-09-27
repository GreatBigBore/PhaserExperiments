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
  
  var TCArchon = function(optimalTempLo, optimalTemp, optimalTempHi) {
    this.optimalTempLo = optimalTempLo;
    this.optimalTemp = optimalTemp;
    this.optimalTempHi = optimalTempHi;
  };
  
  TCArchon.prototype = {
    getAsymmetricCurve: function(temp, a, b, c2, c1, optimal) {
      var c = temp > optimal ? c1 : c2;
  
      return this.getCurve(temp, a, b, c);
    },
      
    getCurve: function(temp, a, b, c) {
      temp /= 1000; a /= 1000;  b /= 1000; c /= 1000;

      var f = -Math.pow(temp - b, 2);
      var g = 2 * Math.pow(c, 2);

      return a * Math.pow(Math.E, f / g);
    },
    
    getTempCost: function(temp) {
      var max = Math.max(Math.abs(this.optimalTempHi), Math.abs(this.optimalTempLo));

      var center = this.optimalTemp;

      var width2 = Math.abs(this.optimalTempHi - this.optimalTemp);
      var width1 = Math.abs(this.optimalTemp - this.optimalTempLo);

      var t = this.optimalTemp;
      var c = this.getAsymmetricCurve(temp, max, center, width1, width2, t);

      if(this.optimalTempLo > 0) {
        c = Math.abs(this.optimalTempHi / 1000) - c;
      } else {
        c = Math.abs(this.optimalTempLo / 1000) - c;
      }
      
      return c;
    }
  };

  var archons = [
    { optimalHiTemp: 600, optimalLoTemp: 400, optimalTemp: 500 },
    { optimalHiTemp: 1000, optimalLoTemp: -1000, optimalTemp: 0 },
    { optimalHiTemp: 500, optimalLoTemp: -500, optimalTemp: 0 },
    { optimalHiTemp: 900, optimalLoTemp: 700, optimalTemp: 800 },
    
    
    { optimalHiTemp: 400, optimalLoTemp: -700, optimalTemp: 300 },
    { optimalHiTemp: 400, optimalLoTemp: -700, optimalTemp: -300 },
    { optimalHiTemp: -300, optimalLoTemp: -800, optimalTemp: -675 },
    { optimalHiTemp: 1100, optimalLoTemp: 800, optimalTemp: 1000 }
  ];
  
  for(var i = 0; i < archons.length; i++) {
    var archon = new TCArchon(archons[i].optimalLoTemp, archons[i].optimalTemp, archons[i].optimalHiTemp);
    
    for(var j = -1000; j <= 1000; j += 100) {
      console.log(j, archon.getTempCost(j).toFixed(4));
    }
  }
}