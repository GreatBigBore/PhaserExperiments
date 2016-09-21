/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game */

"use strict";

var Rob = Rob || {};

(function(Rob) {

Rob.Report = function(genePool) {
  this.genePool = genePool;
  this.accumulator = {};
  this.indexForHistogram = 0;
  this.archonCount = 0;
  this.parasiteCount = 0;
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
  
  drawBar: function(whichBar, height) {
    var graphWidth = 0.4 * game.width;
    var graphLeft = (game.width - graphWidth) / 2;
    var graphBottom = game.height * 0.9;
    var barWidth = graphWidth / 10;
    
    var barLeft = graphLeft + barWidth * whichBar;
    var barTop = graphBottom - height;
    
    Rob.pg.drawRectangle(
      barLeft, barTop, barWidth, height, 'rgba(200, 200, 0, 0.75)', 'black'
    );
  },
  
  isReportable: function(item) {
    return typeof item === 'number';
  },
  
  geneReport: function() {
    Rob.pg.clear();
    
    var json = this.reportAsJson();
    var geneNames = Object.keys(json).sort();
    
    var values = json[geneNames[this.indexForHistogram]].all;

    this.indexForHistogram = (this.indexForHistogram + 1) % geneNames.length;
    
    values.sort(function(a, b) { return a - b; });

    var lowestValue = values[0];
    var range = (values[values.length - 1] - values[0]) * 1.1;
    var barDomain = range / 10;
    var histogram = Array(10).fill(0);

    for(var i = 0; i < values.length; i++) {
      var value = values[i];
    
      var whichBucket = Math.floor((value - lowestValue) / barDomain);
      if(whichBucket === 10) { whichBucket = 9; }
      histogram[whichBucket]++;
    }

    var heightOfTallestBar = 0;
    for(var i = 0; i < histogram.length; i++) {
      if(histogram[i] > heightOfTallestBar) {
        heightOfTallestBar = histogram[i];
      }
    }
  
    for(var i = 0; i < histogram.length; i++) {
      this.drawBar(i, histogram[i] / heightOfTallestBar * 100);
    }
    
    Rob.pg.tx[0].setText(geneNames[this.indexForHistogram]);
    Rob.pg.tx[1].setText(values[0].toFixed(4));
    Rob.pg.tx[2].setText(values[values.length - 1].toFixed(4));
    Rob.pg.tx[3].setText(json[geneNames[this.indexForHistogram]].median.toFixed(4));

    Rob.pg.show(true);
  },

  getJson: function() {
    this.accumulator = {};
    this.archonCount = 0;
    this.parasiteCount = 0;

    var i = null;
    
    this.genePool.forEachAlive(function(p) {
      if(p.archon.parasite) { this.parasiteCount++; }
      
      for(i in Rob.globals.archonia.genomer.primordialGenome) {
        if(i !== 'color') {
          var value = p.archon[i];

          if(this.accumulator[i] === undefined) {
            this.accumulator[i] = {
              all: [value], accumulated: value, average: 0, nearAverage: 0, median: 0, nearMedian: 0,
              minimum: value, nearMinimum: 0, maximum: value, nearMaximum: 0
            };
          } else {
            var entry = this.accumulator[i];

            entry.accumulated += value;
            entry.all.push(value);
            
            if(value < entry.minimum) { entry.minimum = value; }
            if(value > entry.maximum) { entry.maximum = value; }
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
      entry.nearMaximum = this.countValuesNear(i, 'maximum');
      entry.nearMinimum = this.countValuesNear(i, 'minimum');
    }
    
    return this.accumulator;
  },
  
  reportAsJson: function() {
    return this.getJson();
  },
  
  reportAsText: function(dayNumber) {
    var j = this.getJson();
    
    if(this.archonCount === 0) {
      console.log("Extinction");
    } else {
        var keys = Object.keys(j).sort();
  
      console.log("\n\n\nReport for day " + dayNumber + " -- Population " + this.archonCount + ", " +
                  "Births: " + Rob.globals.dailyBirthCounter + ", Deaths: " + Rob.globals.dailyDeathCounter + "\n");
                  
      console.log("\n" + this.parasiteCount + " parasites\n");
                  
      console.log("\n");
      console.log(
        Rob.rPad(Rob.lPad("Gene", 9), 19) +
        Rob.rPad(Rob.lPad("Avg", 7), 10) +
        Rob.rPad(Rob.lPad("±10%", 6), 5) +
        Rob.rPad(Rob.lPad("Min", 8), 10) +
        Rob.rPad(Rob.lPad("±10%", 8), 5) +
        Rob.rPad(Rob.lPad("Med", 8), 10) +
        Rob.rPad(Rob.lPad("±10%", 8), 5) +
        Rob.rPad(Rob.lPad("Max", 8), 10) +
        Rob.rPad(Rob.lPad("±10%", 8), 5)
      );
  
      for(var k in keys) {
        var propertyName = keys[k];
        var entry = j[propertyName];
        
        if(propertyName === 'birthThresholdMultiplier') { propertyName = 'birthThresholdXer'; }
        if(propertyName === 'feedingAccelerationDamper') { propertyName = 'feedingAccDamper'; }
    
        console.log(
          Rob.rPad(propertyName, 20) +
          Rob.rPad(Rob.lPad(entry.average.toFixed(4), 9), 0) + Rob.rPad(Rob.lPad(entry.nearAverage, 5), 0) +
          Rob.rPad(Rob.lPad(entry.minimum.toFixed(4), 12), 0) + Rob.rPad(Rob.lPad(entry.nearMinimum, 6), 0) +
          Rob.rPad(Rob.lPad(entry.median.toFixed (4), 12), 0) + Rob.rPad(Rob.lPad(entry.nearMedian,  6), 0) +
          Rob.rPad(Rob.lPad(entry.maximum.toFixed(4), 12), 0) + Rob.rPad(Rob.lPad(entry.nearMaximum, 6), 0)
        );
      }
    }
    
    Rob.globals.dailyBirthCounter = 0; Rob.globals.dailyDeathCounter = 0;
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
