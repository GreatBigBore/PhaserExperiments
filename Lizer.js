/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global Rob */

"use strict";

Rob.Lizer = function() {
};

Rob.Lizer.prototype.init = function(archon) {
	this.archon = archon;
	this.sprite = archon.sprite;
	this.body = archon.sprite.body;
	this.dna = archon.dna;
	this.frameCount = 0;
};

Rob.Lizer.prototype.eat = function() {
	var calories = Rob.globals.caloriesPerMannaMorsel;

  if(this.adultCalorieBudget > this.dna.embryoThreshold) {
    // Store up for breeding if we have enough reserves already
    this.embryoCalorieBudget += calories;

		if(this.embryoCalorieBudget >= this.costForHavingBabies) {
			this.archon.god.breed(this, this.dna.massOfMyBabies);
			this.embryoCalorieBudget -= this.costForHavingBabies;

			var costToAdultCalorieBudget =
				this.costForHavingBabies - this.embryoCalorieBudget;

			if(costToAdultCalorieBudget < 0) { costToAdultCalorieBudget = 0; }

			this.adultCalorieBudget -= costToAdultCalorieBudget;
		}
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
	this.accumulatedMetabolismCost = 0;

	this.costForHavingBabies =
		this.dna.massOfMyBabies * Rob.globals.embryoCalorieDensity;

	this.archon.god.setSize(this.sprite, this.getMass());
};

Rob.Lizer.prototype.getMass = function() {
	return (
    this.babyCalorieBudget / Rob.globals.babyFatCalorieDensity +
    this.embryoCalorieBudget / Rob.globals.embryoCalorieDensity +
    this.adultCalorieBudget / Rob.globals.adultFatCalorieDensity
  );
};

Rob.Lizer.prototype.metabolize = function() {
	var cost = this.accumulatedMetabolismCost;
	this.accumulatedMetabolismCost = 0;

	if(this.babyCalorieBudget > 0) {
		this.babyCalorieBudget -= cost;
		if(this.babyCalorieBudget < 0) {
			cost = -this.babyCalorieBudget;
			this.babyCalorieBudget = 0;
		} else {
			cost = 0;
		}
	}

	if(this.embryoCalorieBudget > 0) {
		this.embryoCalorieBudget -= cost;
		if(this.embryoCalorieBudget < 0) {
			cost = -this.embryoCalorieBudget;
			this.embryoCalorieBudget = 0;
		} else {
			cost = 0;
		}
	}

	this.adultCalorieBudget -= cost;
	if(cost > 0 &&
		this.adultCalorieBudget < Rob.globals.minimumAdultMass * Rob.globals.adultFatCalorieDensity) {
		console.log('Archon', this.archon.uniqueID, 'just died');
		this.archon.sprite.kill();
		this.archon.sensor.kill();
		this.archon.button.kill();
	} else {
		this.archon.god.setSize(this.sprite, this.getMass());
	}
};

Rob.Lizer.prototype.update = function() {
	this.frameCount++;
	this.metabolize();
}
