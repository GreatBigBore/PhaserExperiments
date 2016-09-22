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
  
  archonReport: function(whichSprite) {
    var a = whichSprite.archon;
    var whichReport = a.whichArchonReport % 2;

    var parasiteIndicator = a.isParasite ? "p" : "np";
    console.log(
      "\n\nReport for archon " + a.uniqueID + "(" + parasiteIndicator + ")" +
      ": mass = " + a.lizer.getMass().toFixed(4) +
      ", age " + Rob.numberFix(whichSprite.archon.frameCount / 60, 2) + " seconds" +
      ", children " + a.howManyChildren
    );
  
    if(whichReport === 0) {
      var lineage = Rob.globals.archonia.familyTree.getLineage(a.uniqueID);
    
      console.log("\nLineage: ", lineage);
  
      console.log("\nMetabolism");
  
      var showStats = function(whichSet) {
        console.log(
          Rob.rPad(whichSet + ": calories in", 28, '.') +
          Rob.lPad(Rob.numberFix(whichSprite.archon.lizer.stats[whichSet].caloriesIn, 2), 10) +
          Rob.rPad(', calories out', 27, '.') +
          Rob.lPad(Rob.numberFix(whichSprite.archon.lizer.stats[whichSet].caloriesOut, 2), 9)
        );
      };

      showStats('thisSecond');
      showStats('thisLifetime');
  
      console.log("\nCalories in:");
  
      var gainLossMessage = whichSprite.archon.isParasite ? ", gained from parasitism" : ", lost to parasites";
      console.log(
        Rob.rPad("Calories from grazing", 28, '.') +
        Rob.lPad(Rob.numberFix(whichSprite.archon.lizer.stats.thisLifetime.grazing, 2), 10) +
        Rob.rPad(gainLossMessage, 27, '.') +
        Rob.lPad(Rob.numberFix(whichSprite.archon.lizer.stats.thisLifetime.parasitism, 2), 9)
      );
  
      console.log("\nCalories out:");

      console.log(
        Rob.rPad("Sensor", 28, '.') +
        Rob.lPad(Rob.numberFix(whichSprite.archon.lizer.stats.thisLifetime.costBreakdown.sensor, 2), 10)
      );
  
      console.log(
        Rob.rPad("Temp in range", 28, '.') +
        Rob.lPad(Rob.numberFix(whichSprite.archon.lizer.stats.thisLifetime.costBreakdown.tempInRange, 2), 10) +
        Rob.rPad(", out of range", 15, '.') +
        Rob.lPad(Rob.numberFix(whichSprite.archon.lizer.stats.thisLifetime.costBreakdown.tempOutOfRange, 2), 9) +
        Rob.rPad(", total", 15, '.') +
        Rob.lPad(Rob.numberFix(whichSprite.archon.lizer.stats.thisLifetime.costBreakdown.totalTemp, 2), 9)
      );
  
      console.log(
        Rob.rPad("Friction", 28, '.') +
        Rob.lPad(Rob.numberFix(whichSprite.archon.lizer.stats.thisLifetime.costBreakdown.friction, 2), 10) +
        Rob.rPad(", inertia", 15, '.') +
        Rob.lPad(Rob.numberFix(whichSprite.archon.lizer.stats.thisLifetime.costBreakdown.inertia, 2), 9) +
        Rob.rPad(", total motion", 15, '.') +
        Rob.lPad(Rob.numberFix(whichSprite.archon.lizer.stats.thisLifetime.costBreakdown.totalMotion, 2), 9)
      );
    } else {
      console.log("\nGenome:");
  
      for(var i in Rob.globals.archonia.genomer.primordialGenome) {
        if(i !== 'color') {
          var value = whichSprite.archon[i];

          console.log(Rob.rPad(i, 28, '.'), Rob.lPad(Rob.numberFix(value, 2), 9));
        }
      }
    }
  },

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
    
    values.sort(function(a, b) { return a - b; });

    var lowestValue = values[0];
    var range = (values[values.length - 1] - values[0]) * 1.1;
    var barDomain = range / 10;
    var histogram = Array(10).fill(0);
    
    var i = null;

    for(i = 0; i < values.length; i++) {
      var value = values[i];
    
      var whichBucket = Math.floor((value - lowestValue) / barDomain);
      if(whichBucket === 10) { whichBucket = 9; }
      histogram[whichBucket]++;
    }

    var heightOfTallestBar = 0;
    for(i = 0; i < histogram.length; i++) {
      if(histogram[i] > heightOfTallestBar) {
        heightOfTallestBar = histogram[i];
      }
    }
  
    for(i = 0; i < histogram.length; i++) {
      this.drawBar(i, histogram[i] / heightOfTallestBar * 100);
    }
    
    Rob.pg.tx[0].setText(geneNames[this.indexForHistogram]);
    Rob.pg.tx[1].setText(values[0].toFixed(4));
    Rob.pg.tx[2].setText(values[values.length - 1].toFixed(4));
    Rob.pg.tx[3].setText(json[geneNames[this.indexForHistogram]].median.toFixed(4));

    Rob.pg.show(true);

    this.indexForHistogram = (this.indexForHistogram + 1) % geneNames.length;
  },

  getJson: function() {
    this.accumulator = {};
    this.archonCount = 0;
    this.parasiteCount = 0;

    var i = null;
    
    this.genePool.forEachAlive(function(p) {
      if(p.archon.isParasite) { this.parasiteCount++; }
      
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
        rPad(lPad("Gene", 9), 19) +
        rPad(lPad("Avg", 7), 10) +
        rPad(lPad("±10%", 6), 5) +
        rPad(lPad("Min", 8), 10) +
        rPad(lPad("±10%", 8), 5) +
        rPad(lPad("Med", 8), 10) +
        rPad(lPad("±10%", 8), 5) +
        rPad(lPad("Max", 8), 10) +
        rPad(lPad("±10%", 8), 5)
      );
  
      for(var k in keys) {
        var propertyName = keys[k];
        var entry = j[propertyName];
        
        if(propertyName === 'birthThresholdMultiplier') { propertyName = 'birthThresholdXer'; }
        if(propertyName === 'feedingAccelerationDamper') { propertyName = 'feedingAccDamper'; }
    
        console.log(
          rPad(propertyName, 20) +
          rPad(lPad(entry.average.toFixed(4), 9), 0) + rPad(lPad(entry.nearAverage, 5), 0) +
          rPad(lPad(entry.minimum.toFixed(4), 12), 0) + rPad(lPad(entry.nearMinimum, 6), 0) +
          rPad(lPad(entry.median.toFixed (4), 12), 0) + rPad(lPad(entry.nearMedian,  6), 0) +
          rPad(lPad(entry.maximum.toFixed(4), 12), 0) + rPad(lPad(entry.nearMaximum, 6), 0)
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

function lPad(value, length, character) {
  if(character === undefined) { character = ' '; }
  
  for(var i = (value).toString().length; i < length; i++) {
    value = character + value;
  }
  
  return value;
}

function rPad(value, length, character) {
  if(character === undefined) { character = ' '; }
  
  for(var i = value.length; i < length; i++) {
    value += character;
  }
  
  return value;
}

})(Rob);

if(typeof window === "undefined") {
  module.exports = Rob;
}
