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
  
  mutateScalar: function(value, sizeOfDomain) {
    var probability = this.changeProbability;
    var range = this.changeRange;
  
    // Hopefull make creation a bit more interesting
    if(Rob.globals.creation) { probability *= 5; range *= 5; }

    // Just to make it interesting, every once in a while, a big change
    var i = null;
    for(i = 0; i < 3; i++) {
      if(this.mutateYN(probability)) {
        range += 10;
        probability += 10;
      } else {
        break;
      }
    }
    
    if(i === 0) {
      return value; // No mutation on this gene for this baby
    } else {
      if(sizeOfDomain === undefined) {
        return Rob.realInRange(
          value * (1 - range / 100), value * (1 + range / 100)
        );
      } else {
        var r = sizeOfDomain * (1 + range / 100);
      
        return Rob.realInRange(value - r, value + r);
      }
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
  var h = this.mutateScalar(hsl.h, 90);   // Make the domain sizes artificially small to
  var s = this.mutateScalar(hsl.s, 0.25); // limit the amount of color change between
  var l = this.mutateScalar(hsl.l, 0.25); // generations. I like to see some signs of inheritance
  

  if(h < 0) { h += 360; } h %= 360; // Treat the hue like the wheel it is
  if(s < 0) { s += 1; s *= 100; s %= 100; s /= 100; }
  if(l < 0) { l += 1; l *= 100; l %= 100; l /= 100; }
  
  hsl = 'hsl(' + h + ', ' + (s.toFixed(2) * 100) + '%, ' + (l.toFixed(2) * 100) + '%)';
  this.color = Rob.tinycolor(hsl);
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
      if(parentGenome[i] !== null && i !== 'archon' && typeof parentGenome[i] !== 'function') {
        this[i].inherit(parentGenome[i]);
      }
    }
  }
};

Rob.Genomer = function() {
  this.makePrimordialGenome();
};

Rob.Genomer.prototype = {
  
  genomifyMe: function(archon) {
    archon.genome = new Rob.Genome(archon, this.primordialGenome);
  },
  
  inherit: function(childArchon, parentArchon) {
    // We already used the primordial to generate the genome for
    // the child archon. Now, if no parent archon is specified,
    // meaning this is a miraculous birth at creation, we're
    // inheriting from the primordial -- but we're not doing anything 
    // weird, and it doesn't waste anything; we're not creating new
    // genes, we're just updating the existing ones, using the
    // primordial as our starting point
    if(parentArchon === undefined) { parentArchon = { genome: this.primordialGenome }; }
    childArchon.genome.inherit(parentArchon.genome);
  },

  makePrimordialGenome: function() {
    this.primordialGenome = {
      avoidDangerousPreyFactor: new Rob.ScalarGene(10),
      birthThresholdMultiplier: new Rob.ScalarGene(Rob.globals.nominalBirthThresholdMultiplier),
      color: new Rob.ColorGene(Rob.tinycolor('hsl(180, 100%, 50%)')),
      feedingAccelerationDamper: new Rob.ScalarGene(1),
      feedingSpeedDamper: new Rob.ScalarGene(1),
      hungerMultiplier: new Rob.ScalarGene(0.0005),
      injuryFactorThreshold: new Rob.ScalarGene(0.5),
      maxMAcceleration: new Rob.ScalarGene(15),
      maxMVelocity: new Rob.ScalarGene(75),
      optimalMass: new Rob.ScalarGene(5),
      offspringEnergy: new Rob.ScalarGene(Rob.globals.nominalOffspringEnergy),
      parasiteChaseFactor: new Rob.ScalarGene(1),
      parasiteFlightFactor: new Rob.ScalarGene(10),
      sensorScale: new Rob.ScalarGene(1),
      targetChangeDelay: new Rob.ScalarGene(5),
      tasteFactor: new Rob.ScalarGene(100),
      tempFactor: new Rob.ScalarGene(1),
      tempRange: new Rob.ScalarGene(Rob.globals.standardArchonTolerableTempRange.hi - Rob.globals.standardArchonTolerableTempRange.lo),
      tempRangeDamping: new Rob.ScalarGene(0.5),
    
      // dummy entries so the getters will work
      optimalTemp: null,
      optimalHiTemp: null,
      optimalLoTemp: null
    };
  }

};

})(Rob);

if(typeof window === "undefined") {
  module.exports = Rob.Genomer;
}
