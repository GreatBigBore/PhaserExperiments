/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

"use strict";

var Rob = Rob || {}, game = game || {}, sprite = sprite || {}, Phaser = Phaser || {};


if(typeof window === "undefined") {
  Rob = require('./Rob.js');
  require('./tinycolor.js');

  game = require('./PhaserMockups/game.js');
  sprite = require('./PhaserMockups/sprite.js');
  Phaser = require('./PhaserMockups/Phaser.js');
}

(function(Rob) {
  
Rob.Gene = function() {
  // Archonia always begins with a 10% chance of a +/- 10% change
  this.changeProbability = 10;
  this.changeRange = 10;
};

Rob.Gene.prototype = {
  inherit: function() { throw new TypeError("Gene base class doesn't inherit"); },
  
  mutateMutatability: function(parentGene) {
    // Have to assign these first, before the mutation, because the
    // mutation function needs them in place before it can
    // operate properly.
    this.changeProbability = parentGene.changeProbability;
    this.changeRange = parentGene.changeRange;

    var newChangeProbability = this.mutateScalar(parentGene.changeProbability);
    var newChangeRange = this.mutateScalar(parentGene.changeRange);
    
    this.changeProbability = newChangeProbability;
    this.changeRange = newChangeRange;
  },
  
  mutateScalar: function(value, operation) {
    var probability = this.changeProbability;
    var range = this.changeRange;
  
    // Hopefull make creation a bit more interesting
    if(Rob.globals.creation) { probability *= 2; range *= 2; }

    // Just to make it interesting, every once in a while, a big change
    for(var i = 0; i < 3; i++) {
      if(this.mutateYN(probability)) {
        range += 10;
        probability += 10;
      } else {
        break;
      }
    }

    if(operation === 'multiply' || operation === undefined) {
      return Rob.realInRange(
        value * (1 - range / 100), value * (1 + range / 100)
      );
    } else {
      return Rob.realInRange(value - range, value + range);
    }
  },
  
  mutateYN: function() { return Rob.integerInRange(1, 100) < this.changeProbability; }
};

Rob.ScalarGene = function(geneScalarValue) { this.value = geneScalarValue; Rob.Gene.call(this); };

Rob.ScalarGene.prototype = Object.create(Rob.Gene.prototype);
Rob.ScalarGene.prototype.constructor = Rob.ScalarGene;
Rob.ScalarGene.prototype.newGene = function() { return new Rob.ScalarGene(); };

Rob.ScalarGene.prototype.inherit = function(parentGene) {
  this.mutateMutatability(parentGene);
  this.value = this.mutateScalar(parentGene.value);
};

Rob.ColorGene = function(gene) { this.color = Rob.tinycolor(gene); Rob.Gene.call(this); };

Rob.ColorGene.prototype = Object.create(Rob.Gene.prototype);
Rob.ColorGene.prototype.constructor = Rob.ColorGene;
Rob.ColorGene.prototype.newGene = function() { return new Rob.ColorGene(); };

Rob.ColorGene.prototype.inherit = function(parentGene) {
  this.mutateMutatability(parentGene);

  var color = Rob.tinycolor(parentGene.color);

  var hsl = color.toHsl();
  var h = this.mutateScalar(hsl.h, 'add');
  var s = this.mutateScalar(hsl.s, 'add');
  var l = this.mutateScalar(hsl.l, 'add');
  

  if(h < 0) { h += 360; } h %= 360; // Treat the hue like the wheel it is
  if(s < 0) { s += 100; } s %= 100;
  if(l < 0) { l += 100; } l %= 100;
  
  this.color = Rob.tinycolor('hsl(' + h + ', ' + s + '%, ' + l + '%)');
};

Rob.ColorGene.prototype.getColorAsDecimal = function() { return parseInt(this.color.toHex(), 16); };
Rob.ColorGene.prototype.getOptimalHiTemp = function() { return this.getOptimalTemp() + this.archon.tempRange / 2; };
Rob.ColorGene.prototype.getOptimalLoTemp = function() { return this.getOptimalTemp() - this.archon.tempRange / 2; };

Rob.ColorGene.prototype.getOptimalTemp = function() {
  var L = this.color.toHsl().l;
  var t = Rob.globals.temperatureRange.convertPoint(L, Rob.globals.oneToZeroRange);
  return t;
};

Rob.Genome = function(archon, parentGenome) {
  this.archon = archon;
  
  for(var i in parentGenome) {
    if(parentGenome[i] === null) {
      this[i] = null; // For dummy properties so our getters will work -- I hope!
    } else {
      this[i] = parentGenome[i].newGene();
      this[i].archon = archon;
    }
  }
};

Rob.Genome.prototype = {
  inherit: function(parentGenome) {
    for(var i in parentGenome) {
      if(parentGenome[i] !== null) { this[i].inherit(parentGenome[i]); }
    }
  }
};

Rob.Genomer = function(archon) {
  this.archon = archon;
};

Rob.Genomer.prototype = {
  
  // This is only for archons that have never been launched. After launch
  // they will retain their genomes even after they die, so we never have
  // to do this after the first launch. On recycling, we just reset their
  // genomes by inheriting from the parent
  genomifyChildArchon: function(parentGenome) {
    if(parentGenome === null) { parentGenome = this.primordialGenome; } // For miraculous births at creation

    if(this.archon.genome === undefined) {
      this.archon.genome = new Rob.Genome(this.archon, parentGenome);
    }
    
    this.archon.genome.inherit(parentGenome);
  },
  
  init: function() {},

  launch: function() {},

  ready: function() {},

  tick: function() {},

  primordialGenome: {
    // This is the only time we pass values to the constructors.
    // For all births, we pass nulls and inherit from the parent.
    // Note that even the initial, miraculous births inherit too;
    // this object is the only one that creates genes from scratch.
    color: new Rob.ColorGene(Rob.tinycolor('hsl(180, 100%, 50%)')),
    embryoThresholdMultiplier: new Rob.ScalarGene(1.1),
    hungerMultiplier: new Rob.ScalarGene(0.0005),
    maxAcceleration: new Rob.ScalarGene(15),
    maxVelocityMagnitude: new Rob.ScalarGene(75),
    optimalMass: new Rob.ScalarGene(5),
    offspringMass: new Rob.ScalarGene(0.5),
    sensorScale: new Rob.ScalarGene(1),
    targetChangeDelay: new Rob.ScalarGene(30),
    tasteFactor: new Rob.ScalarGene(1),
    tempFactor: new Rob.ScalarGene(1),
    tempRange: new Rob.ScalarGene(400),
    optimalTemp: null,
    optimalHiTemp: null,
    optimalLoTemp: null
  }

};

})(Rob);

if(typeof window === "undefined") {
  module.exports = Rob.Genomer;
}
