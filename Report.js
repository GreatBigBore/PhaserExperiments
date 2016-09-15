/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

"use strict";

var Rob = Rob || {};

if(typeof window === "undefined") {
}

(function(Rob) {

Rob.Report = function(genePool) {
  this.genePool = genePool;
  
  this.accumulator = {};
  this.archonCount = 0;
};

Rob.Report.prototype = {
  
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
                r: { all: [], accumulated: 0, average: 0, median: 0 },
                g: { all: [], accumulated: 0, average: 0, median: 0 },
                b: { all: [], accumulated: 0, average: 0, median: 0 }
              }
            } else {
              this.accumulator[i] = {
                all: [], accumulated: 0, average: 0, median: 0
              };
            }
          }
          
          if(i === 'color') {
            this.accumulator[i].r.accumulated += value.r;
            this.accumulator[i].g.accumulated += value.g;
            this.accumulator[i].b.accumulated += value.b;
            
            this.accumulator[i].r.all.push(value.r);
            this.accumulator[i].g.all.push(value.g);
            this.accumulator[i].b.all.push(value.b);
          } else {
            this.accumulator[i].accumulated += value;
            this.accumulator[i].all.push(value);
          }
        }
      }

      this.archonCount++
    }, this);
    
    for(var i in this.accumulator) {
      var entry = this.accumulator[i];
      
      if(i === 'color') {
        entry.r.average = entry.r.accumulated / this.archonCount;
        entry.g.average = entry.g.accumulated / this.archonCount;
        entry.b.average = entry.b.accumulated / this.archonCount;
        
        entry.r.median = getMedian(entry.r.all);
        entry.g.median = getMedian(entry.g.all);
        entry.b.median = getMedian(entry.b.all);
      } else {
        entry.average = entry.accumulated / this.archonCount;
        entry.median = getMedian(entry.all);
      }
    }
    
    return this.accumulator;
  },
  
  reportAsJson: function(report) {
    return this.getJson();
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
