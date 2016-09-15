/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

"use strict";

var Rob = Rob || {};

(function(Rob) {

Rob.Report = function(genePool) {
  this.genePool = genePool;
  
  this.accumulator = {};
  this.archonCount = 0;
};

Rob.Report.prototype = {
  
  countColorsNear: function(colorName, whichField) {
    var count = 0;
    var valueToCheck = this.accumulator.color[colorName][whichField];
    var closeEnough = Math.abs(valueToCheck) / 10;
    
    this.genePool.forEachAlive(function(p) {
      if(Math.abs(valueToCheck - p.color[colorName]) <= closeEnough) {
        count++;
      }
    });
    
    return count;
  },
  
  countValuesNear: function(propertyName, whichField) {
    var count = 0;
    var valueToCheck = this.accumulator[propertyName][whichField];
    var closeEnough = Math.abs(valueToCheck / 10);
    
    this.genePool.forEachAlive(function(p) {
      if(Math.abs(valueToCheck - p[propertyName]) <= closeEnough) {
        count++;
      }
    });
    
    return count;
  },
  
  isReportable: function(item) {
    return typeof item !== "function";
  },

  getJson: function() {
    var i = null;
    
    this.genePool.forEachAlive(function(p) {
      for(i in p) {
        var value = p[i];
        
        if(this.isReportable(value)) {
          if(this.accumulator[i] === undefined) {
            if(i === 'color') {
              this.accumulator[i] = {
                r: { all: [], accumulated: 0, average: 0, nearAverage: 0, median: 0, nearMedian: 0 },
                g: { all: [], accumulated: 0, average: 0, nearAverage: 0, median: 0, nearMedian: 0 },
                b: { all: [], accumulated: 0, average: 0, nearAverage: 0, median: 0, nearMedian: 0 }
              };
            } else {
              this.accumulator[i] = { all: [], accumulated: 0, average: 0, nearAverage: 0, median: 0, nearMedian: 0 };
            }
          }
          
          if(i === 'color') {
            this.accumulator.color.r.accumulated += value.r;
            this.accumulator.color.g.accumulated += value.g;
            this.accumulator.color.b.accumulated += value.b;
            
            this.accumulator.color.r.all.push(value.r);
            this.accumulator.color.g.all.push(value.g);
            this.accumulator.color.b.all.push(value.b);
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
      
      if(i === 'color') {
        entry.r.average = entry.r.accumulated / this.archonCount;
        entry.g.average = entry.g.accumulated / this.archonCount;
        entry.b.average = entry.b.accumulated / this.archonCount;
        
        entry.r.median = getMedian(entry.r.all);
        entry.g.median = getMedian(entry.g.all);
        entry.b.median = getMedian(entry.b.all);
        
        entry.r.nearAverage = this.countColorsNear('r', 'average');
        entry.g.nearAverage = this.countColorsNear('g', 'average');
        entry.b.nearAverage = this.countColorsNear('b', 'average');
        
        entry.r.nearMedian = this.countColorsNear('r', 'median');
        entry.g.nearMedian = this.countColorsNear('g', 'median');
        entry.b.nearMedian = this.countColorsNear('b', 'median');
      } else {
        entry.average = entry.accumulated / this.archonCount;
        entry.median = getMedian(entry.all);

        entry.nearAverage = this.countValuesNear(i, 'average');
        entry.nearMedian = this.countValuesNear(i, 'median');
      }
    }
    
    return this.accumulator;
  },
  
  reportAsJson: function() {
    return this.getJson();
  },
  
  reportAsText: function(dayNumber) {
    var j = this.getJson();
    var keys = Object.keys().sort();
    
    console.log("Report for day " + dayNumber + ":");
    console.log("Population: " + keys.length);
    
    for(var k in keys) {
      var entry = j[k];
      
      console.log(k + ": average " + entry.average.toFixed(4) + ", median " + entry.median.toFixed(4));
      console.log("\t\tArchons w/in 10% of average " + entry.nearAverage + ", of median " + entry.nearMedian);
    }
  }

};

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
