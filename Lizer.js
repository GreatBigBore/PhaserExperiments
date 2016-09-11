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

	this.mannaNutritionRange =
		Rob.Range(Rob.globals.caloriesPerMannaMorsel, 3 * Rob.globals.caloriesPerMannaMorsel);
};

Rob.Lizer.prototype.eat = function() {
	var sunStrength = Rob.globals.archonia.sun.getStrength();
	var calories = this.mannaNutritionRange.convertPoint(sunStrength, Rob.globals.oneToZeroRange);

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

Rob.Lizer.prototype.launch = function(parent, birthWeight) {
	this.expirationDate = this.dna.lifetime + this.frameCount;
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

Rob.Lizer.prototype.getTemperature = function() {
	return Rob.getTemperature(this.sprite.x, this.sprite.y);
};

Rob.Lizer.prototype.getSpeed = function() {
	return Rob.XY(this.body.velocity).getMagnitude();
};

Rob.Lizer.prototype.metabolize = function() {
	var cost = 0, c = 0, t = "Lizer: ";
	var temp = this.getTemperature();
	var speed = this.getSpeed();

	// Costs for keeping the body warm, for moving, and
	// for simply maintaining the body
	c = Math.abs(temp - this.archon.dna.optimalTemp) * Rob.globals.lizerCostPerTemp;
	t += "t = " + c.toFixed(4);
	cost += c;

	c = speed * Rob.globals.lizerCostPerSpeed;
	t += ", s = " + c.toFixed(4);
	cost += c;

	c = this.getMass() * Rob.globals.lizerCostPerMass;
	t += ", m = " + c.toFixed(4);
	cost += c;

	t += ", total = " + cost.toFixed(4);
	//if(this.archon.uniqueID === 0 && this.frameCount % 60 === 0) { console.log(t); }

	c = this.getMass();
	t = "Before: " + c.toFixed(4);

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

	var minimumCalorieBudget = Rob.globals.minimumAdultMass * Rob.globals.adultFatCalorieDensity;
	var causeOfDeath = null;

	// If there's any cost remaining, see if it can come out
	// of his adult calorie budget
	if(cost > 0 && this.adultCalorieBudget < minimumCalorieBudget) {
		causeOfDeath = 'malnourishment';
	} else if(this.frameCount > this.expirationDate) {
		causeOfDeath = 'old age';
	} else {
		this.adultCalorieBudget -= cost;
	}

	c = this.getMass();
	t = "After: " + c.toFixed(4);
	//if(this.archon.uniqueID === 0 && this.frameCount % 60 === 0) { console.log(t); }

	if(causeOfDeath !== null) {
		console.log('Archon', this.archon.uniqueID, 'just died of', causeOfDeath);
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
};
