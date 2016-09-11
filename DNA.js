/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game, Rob */

"use strict";

if(typeof window === "undefined") {
  exports.Rob = require('./Rob.js').Rob;
}

Rob.dnaConstants = {
  archonHeroSize: 100,
  archonMortalSizeScale: 0.0005,
  archonStandardOptimalTemp: 0,
  archonStandardLifetime: 5 * 60 * 60,  // Five minutes
  archonStandardTempRange: 400,
  embryoThresholdMultiplier: 1.1,
  avoidanceFactor: -1,
  smellFactor: 2,
  tempFactor: 1,
  velocityFactor: 1,
  tasteFactor: 3
};

Rob.aboriginalDNA = {
  avoidanceFactor: Rob.dnaConstants.avoidanceFactor,
  massOfMyBabies: Rob.globals.standardBabyMass,
  embryoThreshold: 0,
  tasteFactor: Rob.dnaConstants.tasteFactor,
  lifetime: Rob.dnaConstants.archonStandardLifetime,
  maxAcceleration: Rob.globals.maxAcceleration,
  maxVelocity: Rob.globals.maxSpeed,
  motionMultiplier: 30,
  optimalMass: 5,
  optimalTemp: Rob.dnaConstants.archonStandardOptimalTemp,
  sensorSize: 1,
  smellFactor: Rob.dnaConstants.smellFactor,
  tempFactor: Rob.dnaConstants.tempFactor,
  tempRange: Rob.dnaConstants.archonStandardTempRange,
  velocityFactor: Rob.dnaConstants.velocityFactor,

  color: { r: 0x88, g: 0x88, b: 0x88 }
};

Rob.DNA = function() {
};

Rob.DNA.prototype.launch = function(parent) {
  if(parent === undefined) {
    parent = {
      dna: Object.assign({}, Rob.aboriginalDNA)
    };

    // Just copy from the aboriginal, don't mutate
    for(var j in parent.dna) {
      this[j] = parent.dna[j];
    }

  } else {
    this.color = Object.assign({}, parent.dna.color);

    for(var i in parent.dna) {
      this.mutate(i, parent.dna);
    }
  }

  this.finalSetup(parent.dna);
};

Rob.DNA.prototype.finalSetup = function(dnaSource) {
  this.embryoThreshold = (
    Rob.dnaConstants.embryoThresholdMultiplier *
    ((dnaSource.massOfMyBabies * Rob.globals.embryoCalorieDensity) +
    (dnaSource.optimalMass * Rob.globals.adultFatCalorieDensity))
  );

  var colorAdjustment = this.getTempFromColor(dnaSource.color);
  var halfTempRange = dnaSource.tempRange / 2;

  this.optimalTemp = dnaSource.optimalTemp;
  this.optimalHiTemp = dnaSource.optimalTemp + halfTempRange;
  this.optimalLoTemp = dnaSource.optimalTemp - halfTempRange;

	this.optimalTemp += colorAdjustment;
	this.optimalHiTemp += colorAdjustment;
	this.optimalLoTemp += colorAdjustment;

  this.clampTemp();
};

Rob.DNA.prototype.getTint = function() {
	return (
		this.color.r * Math.pow(2, 16) +
		this.color.g * Math.pow(2, 8) +
		this.color.b
	);
};

// Not using this yet; too lazy so far
// probability = how likely it is for a mutation to occur
// range: percentage of change allowable; from 1 - (range / 100) to 1 + (range / 100)
Rob.DNA.prototype.scalarMutations = {
  color: { probability: 10, range: 10 },
	embryoThreshold: { probability: 10, range: 10 },
  lifetime: { probability: 10, range: 10 },
  massOfMyBabies: { probability: 10, range: 10 },
	maxAcceleration: { probability: 10, range: 10 },
	maxVelocity: { probability: 10, range: 10 },
  motionMultiplier: { probability: 10, range: 10 },
	optimalTemp: { probability: 10, range: 10 },
	optimalHiTemp: { probability: 10, range: 10 },
	optimalLoTemp: { probability: 10, range: 10 },
	optimalMass: { probability: 10, range: 10 },
	sensorSize:  { probability: 10, range: 10 },
  smellFactor: { probability: 10, range: 10 },
  tempFactor: { probability: 10, range: 10 },
  velocityFactor: { probability: 10, range: 10 },
  avoidanceFactor: { probability: 10, range: 10 },
  tasteFactor: { probability: 10, range: 10 }

};

Rob.DNA.prototype.clampTemp = function() {
  this.optimalHiTemp = Math.max(this.optimalHiTemp, this.optimalTemp);
	this.optimalLoTemp = Math.min(this.optimalLoTemp, this.optimalTemp);
};

Rob.DNA.prototype.mutate = function(traitName, parentDNA) {
  if(parentDNA[traitName] instanceof Function) {
    return;
  }

	switch(traitName) {
		case 'color': this.mutateColor(parentDNA.color); break;
		case 'optimalTemp': this.mutateTemperatureStuff(parentDNA); break;
    case 'tempRange': break;
		case 'optimalHiTemp': break;	// We do this along with optimal temp
		case 'optimalLoTemp': break;	// We do this along with optimal temp
		case 'scalarMutations': break;	// Not a mutatable kind of thing!
    case 'sprite': break;           // Again, not mutatable kind of thing
		default: {

      // Just for showing the cool message about mutation
			var originalValue = parentDNA[traitName];

      // This is the part that matters
			this.mutateScalar(traitName, parentDNA);

      // Just for showing the cool message about mutation
			var newValue = this[traitName];

			if(originalValue !== newValue) {
				console.log(traitName, 'mutated to', newValue.toFixed(4), 'from', originalValue.toFixed(4));
			}
		}

		break;
	}
};

Rob.DNA.prototype.mutateColor = function(parentColors) {
	var colors = ['r', 'g', 'b'];
	var mutated = false;
	for(var i in colors) {
    var c = colors[i];
		this.color[c] = Math.floor(this.mutateScalar_(
      parentColors[c],
      this.scalarMutations.color.probability,
      this.scalarMutations.color.range
    ));

    // Just so I can show the cool message about color mutation
		if(this.color[c].toString(16) !== parentColors[c].toString(16)) { mutated = true; }
	}

	if(mutated) {
		console.log(
			'Color mutated to',
			this.color.r.toString(16) + this.color.g.toString(16) + this.color.b.toString(16),
			'from',
			parentColors.r.toString(16) + parentColors.g.toString(16) + parentColors.b.toString(16)
		);
	}
};

Rob.DNA.prototype.mutateScalar = function(traitName, parentDNA) {
  this[traitName] = this.mutateScalar_(
    parentDNA[traitName],
    this.scalarMutations[traitName].probability,
    this.scalarMutations[traitName].range
  );
};

Rob.DNA.prototype.mutateScalar_ = function(value, probability, range) {
  var scratchRange = 0;

  // Just to make it interesting, every once in a while, a big change
  for(var i = 0; i < 3; i++) {
    if(this.mutateYN(probability)) {
      scratchRange += range;
      probability += 10;
    } else {
      break;
    }
  }

  return game.rnd.realInRange(
    value * (1 - scratchRange / 100), value * (1 + scratchRange / 100)
  );
};

Rob.DNA.prototype.mutateTemperatureStuff = function(parentDNA) {
  this.mutateScalar('optimalTemp', parentDNA);
  this.mutateScalar('optimalHiTemp', parentDNA);
  this.mutateScalar('optimalLoTemp', parentDNA);
  this.clampTemp();

  this.tempRange = this.optimalHiTemp - this.optimalLoTemp;
};

Rob.DNA.prototype.mutateYN = function(probability) {
	return game.rnd.integerInRange(1, 100) < probability;
};

Rob.DNA.prototype.getRandomTint = function() {
  var r = game.rnd.integerInRange(128, 255);
  var g = game.rnd.integerInRange(128, 255);
  var b = game.rnd.integerInRange(128, 255);

	return {r: r, g: g, b: b};
};

// We dont need the exact luma value; an approximation will do
Rob.DNA.prototype.getTempFromColor = function(color) {
	var temp = (2 * color.r + color.g + 3 * color.b) / 6;

  return Rob.globals.standardArchonTolerableTempRange.convertPoint(
    temp, Rob.globals.archonColorRange
  );
};

Rob.DNA.prototype.setColor = function() {
	this.color = this.getRandomTint();
  console.log('color set to', this.color);
};

if(typeof window === "undefined") {
  exports.Rob.DNA = new Rob.DNA();
}
