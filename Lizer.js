/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game, Rob, theSpreader */

"use strict";

Rob.Lizer = function(sprite) {
	this.dna = sprite.dna;
	sprite.lizer = this;
};

Rob.Lizer.prototype.eat = function(calories) {
  if(this.adultCalorieBudget > this.dna.embryoThreshold) {
    // Store up for breeding if we have enough reserves already
    this.embryoCalorieBudget += calories;
  } else {
    // Don't start building if we don't have reserves, or
    // if we're not an adult yet
    this.adultCalorieBudget += calories;
  }
};

Rob.Lizer.prototype.ensoul = function(parent) {
	this.adultCalorieBudget = 0;	// Birth weight should be set by the parent
	this.babyCalorieBudget = 0;
	//this.embryoCalorieBudget = parent.archon.getBabyMass() * Rob.globals.embryoCalorieDensity;
};

Rob.Lizer.prototype.getMass = function() {
	return (
    this.babyCalorieBudget / Rob.globals.babyFatCalorieDensity +
    this.embryoCalorieBudget / Rob.globals.embryoCalorieDensity +
    this.adultCalorieBudget / Rob.globals.adultFatCalorieDensity
  );
};

Rob.Lizer.metabolize = function() {

};
