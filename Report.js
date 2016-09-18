/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game */

"use strict";

var Rob = Rob || {};

(function(Rob) {

Rob.Report = function(genePool) {
  this.genePool = genePool;
  this.accumulator = {};
};

Rob.Report.prototype = {
  
  countValuesNear: function(propertyName, whichField) {
    var count = 0;
    var valueToCheck = this.accumulator[propertyName][whichField];
    var closeEnough = Math.abs(valueToCheck / 10);
    
    this.genePool.forEachAlive(function(p) {
      if(Math.abs(valueToCheck - p.archon[propertyName]) <= closeEnough) {
        count++;
      }
    });
    
    return count;
  },
  
  isReportable: function(item) {
    return typeof item === 'number';
  },

  getJson: function() {
    this.accumulator = {};
    this.archonCount = 0;

    var i = null;
    
    this.genePool.forEachAlive(function(p) {
      for(i in Rob.Genomer.primordialGenome) {
        if(i !== 'color') {
          var value = p.archon[i];

          if(this.accumulator[i] === undefined) {
            this.accumulator[i] = { all: [value], accumulated: value, average: 0, nearAverage: 0, median: 0, nearMedian: 0 };
          } else {
            this.accumulator[i].accumulated += value;
            this.accumulator[i].all.push(value);
          }
        }
      }

      this.archonCount++;
    }, this);
    
    for(i in this.accumulator) {
      var entry = this.accumulator[i];
      
      entry.average = entry.accumulated / this.archonCount;
      entry.median = getMedian(entry.all);

      entry.nearAverage = this.countValuesNear(i, 'average');
      entry.nearMedian = this.countValuesNear(i, 'median');
    }
    
    this.accumulator.population = this.archonCount;
    
    return this.accumulator;
  },
  
  reportAsJson: function() {
    return this.getJson();
  },
  
  reportAsText: function(dayNumber) {
    var j = this.getJson();
    
    if(this.archonCount === 0) {
      console.log("They're all dead, and you're a terrible person");
      game.state.start('Extinction');
    } else {
        var keys = Object.keys(j).sort();
  
      console.log("\n\n\nReport for day " + dayNumber + " -- Population " + j.population + ", " +
                  "Births: " + Rob.globals.dailyBirthCounter + ", Deaths: " + Rob.globals.dailyDeathCounter + "\n");
  
      for(var k in keys) {
        var propertyName = keys[k];
        var entry = j[propertyName];
        
        if(propertyName === 'embryoThresholdMultiplier') { propertyName = 'embryoThreshold'; }
    
        if(propertyName !== 'population') {
          console.log(rPad(propertyName, 20) + " -- average: " + lPad(entry.average.toFixed(4), 10) + ' / ' + lPad(entry.nearAverage, 2) +
                      ", median: " + lPad(entry.median.toFixed(4), 10) + ' / ' + lPad(entry.nearMedian, 2));
        }
      }
    }
    
    Rob.globals.dailyBirthCounter = 0; Rob.globals.dailyDeathCounter = 0;
  }

};

function rPad(value, length) {
  for(var i = value.length; i < length; i++) {
    value += ' ';
  }
  
  return value;
}

function lPad(value, length) {
  for(var i = (value).toString().length; i < length; i++) {
    value = ' ' + value;
  }
  
  return value;
}

function getMedian(values) {
  values.sort(function(lhs, rhs) {
    return lhs - rhs;
  });
  
  var index = null;
  var median = null;
  
  if(values.length % 2 === 0) {
    index = values.length / 2;
    median = (values[index] + values[index - 1]) / 2;
  } else {
    index = Math.floor(values.length / 2);
    median = values[index];
  }
  
  return median;
}

})(Rob);

if(typeof window === "undefined") {
  module.exports = Rob;
}
