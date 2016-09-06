/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global Rob */

"use strict";

Rob.Lizer = function(sprite) {
	this.archon = sprite.archon;
	this.sprite = sprite;
	this.body = sprite.body;
	this.dna = this.archon.dna;
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

	this.archon.god.setSize(this.sprite, this.getMass());
};

Rob.Lizer.prototype.ensoul = function(parent, birthWeight) {
	this.adultCalorieBudget = 0;
	this.babyCalorieBudget = 0;
	this.embryoCalorieBudget = birthWeight * Rob.globals.embryoCalorieDensity;

	this.archon.god.setSize(this.sprite, this.getMass());
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
