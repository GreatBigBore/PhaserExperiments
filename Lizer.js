/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global Rob */

"use strict";

Rob.Lizer = function(archon) {
  this.archon = archon;
  this.frameCount = 0;
  
  this.mannaNutritionRange =
  	new Rob.Range(Rob.globals.caloriesPerManna, 2 * Rob.globals.caloriesPerManna);
    
  this.stats = {
    thisSecond: { caloriesIn: 0, caloriesOut: 0 },
    thisLifetime: {
      caloriesIn: 0, caloriesOut: 0, grazing: 0, parasitism: 0, costBreakdown: {
        sensor: 0, tempInRange: 0, tempOutOfRange: 0, totalTemp: 0, friction: 0, inertia: 0, totalMotion: 0
      }
    }
  };
};

Rob.Lizer.prototype.eat = function(foodParticle) {
  // Once we've caught the food, tell the mover
  // and the accel that we're ready to move again
  this.archon.mover.noNewTargetUntil = 0;
  this.archon.accel.maneuverComplete = true;
  
  foodParticle.kill();
  
	var sunStrength = Rob.globals.archonia.sun.getStrength();
	var calories = this.mannaNutritionRange.convertPoint(sunStrength, Rob.globals.oneToZeroRange);
  
  // Parasites have to supplement their diet with blood
  if(this.archon.isParasite) {
    calories *= 0.75;
  }

  this.absorbCalories(calories);
  
  this.stats.thisLifetime.grazing += calories;
};

Rob.Lizer.prototype.absorbCalories = function(calories) {
  this.calorieBudget += calories;
  this.stats.thisSecond.caloriesIn += calories;
  
  if(this.babyCalorieBudget > 0) {
    this.calorieBudget += calories;
  } else if(this.calorieBudget >= (Rob.globals.optimalAdultMass * Rob.globals.fatDensity)) {
    this.embryoCalorieBudget += calories;
  } else {
    this.calorieBudget += calories;
  }
  
  if(this.embryoCalorieBudget > this.birthThreshold) {
    this.archon.breed();
    this.embryoCalorieBudget -= this.whatILoseWhenIReproduce;
    
    if(this.embryoCalorieBudget < 0) {
      this.calorieBudget -= this.whatILoseWhenIReproduce;
    }
    
    this.processCalorieLoss();
  }
  
  if(this.archon.sprite.alive) {
    this.setSize();
  }
};

Rob.Lizer.prototype.ffAction = function(him) {
  // Note that we do this in only one direction, wherƒe I am predatory;
  // the case where he is predatory will be taken care of on his tick.

  var massRatio = him.archon.lizer.getMass() / this.getMass();

  var fp = this.archon.locator.getStandardFlightPlan(massRatio, him);

  if(fp.iWillBeParasitized) {
    
    this.absorbCalories(-Rob.globals.caloriesLostPerParasiteBite);
    this.stats.thisLifetime.parasitism += Rob.globals.caloriesLostPerParasiteBite;

  } else if(fp.iWillParasitize) {

    var caloriesGained = him.archon.isDisabled ?
      Rob.globals.caloriesGainedPerInjuredParasiteBite : Rob.globals.caloriesGainedPerParasiteBite;
  
    this.absorbCalories(caloriesGained);

    // Entropy; no one gets the full benefit of all their prey's lost calories
    this.stats.thisLifetime.parasitism += caloriesGained;
    
  }

  if(fp.iWillBeInjured) {
    
    // It's possible to be injured even if I get to eat.
    // Also, only parasites can be injured, and only non-disabled ones.
    // Non-parasites and disabled parasites are parasitized
    this.archon.injuryFactor += 0.001 / 60;
    this.archon.maxMVelocity *= 1 - this.archon.injuryFactor;
    
  } else if(fp.iWillInjure) {

    this.archon.isDefending = true;
    
  }
};

Rob.Lizer.prototype.howPredatoryAmI = function(baseValue) {
  return this.howHungryAmI(baseValue) * Rob.globals.caloriesGainedPerParasiteBite / Rob.globals.caloriesPerMannaMorsel;
};

Rob.Lizer.prototype.howHungryAmI = function(baseValue) {
  if(baseValue === undefined) { baseValue = 1; }
  
  var hunger = (
    (this.birthThreshold - this.calorieBudget) * this.archon.hungerMultiplier
  );
  
  return Math.abs(baseValue * this.archon.tasteFactor * hunger);
};

Rob.Lizer.prototype.getMass = function(useDefaults) {
  var babyCalories = null, adultCalories = null, embryoCalories = null;
  
  if(useDefaults === undefined) {
    babyCalories = this.babyCalorieBudget;
    adultCalories = this.calorieBudget;
    embryoCalories = this.embryoCalorieBudget;
  } else {
    babyCalories = Rob.globals.babyFatAtBirth;
    adultCalories = Rob.globals.adultFatAtbirth;
    embryoCalories = 0;
  }

  return  (
    (adultCalories / Rob.globals.fatDensity) +
    (babyCalories / Rob.globals.babyFatDensity) +
    (embryoCalories / Rob.globals.embryoFatDensity)
  );
};

Rob.Lizer.prototype.getMotionCost = function() {
  var c = 0, d = 0, e = 0, motion = this.archon.accel.getMotion();
  
  d = motion.mVelocity * Rob.globals.mVelocityBurnRate;
  e = motion.mAcceleration * Rob.globals.mAccelerationBurnRate;

  c += d + e;

  this.stats.thisLifetime.costBreakdown.friction += d;
  this.stats.thisLifetime.costBreakdown.inertia += e;
  this.stats.thisLifetime.costBreakdown.totalMotion += c;
  
  return c;
};

Rob.Lizer.prototype.getTemperature = function() {
	return Rob.getTemperature(this.archon.position.x, this.archon.position.y);
};

Rob.Lizer.prototype.getTempCost = function(temp) {
  var c = 0, d = 0, e = 0, f = 0;
  
	// Costs for keeping the body warm

  var geneticTempRange = this.archon.optimalHiTemp - this.archon.optimalLoTemp;
  var worldTempRange = Rob.globals.temperatureHi - Rob.globals.temperatureLo;
  
  if(temp < this.archon.optimalTemp) {
    if(temp < this.archon.optimalLoTemp) {
      c = -this.archon.optimalLoTemp;
      d = this.archon.optimalLoTemp - temp;
    } else {
      c = this.archon.optimalTemp - temp;
    }
  } else if(temp > this.archon.optimalTemp) {
    if(temp > this.archon.optimalHiTemp) {
      c = this.archon.optimalHiTemp;
      d = temp - this.archon.optimalHiTemp;
    } else {
      c = temp - this.archon.optimalTemp;
    }
  }

  c *= Rob.globals.standardTempBurnRate * (1 + geneticTempRange / worldTempRange);
  d *= Rob.globals.excessTempBurnRate * (1 + geneticTempRange / worldTempRange);
  
  // There's also a cost for having the ability to tolerate wide temperature ranges
  var standardTempRange = Rob.globals.standardArchonTolerableTempRange.hi - Rob.globals.standardArchonTolerableTempRange.lo;

  if(geneticTempRange > standardTempRange) {
    d *= 1 + (standardTempRange / geneticTempRange);
  }

  // This will make the costs grow with size, but logarithmically
  e = Math.floor(
    Rob.globals.oneToTenRange.convertPoint(this.archon.getSize(), Rob.globals.archonSizeRange)
  );
  
  f = Math.pow(1.07, e);

  var totalCost = (c + d) * f;

  this.stats.thisLifetime.costBreakdown.tempInRange += c * f;
  this.stats.thisLifetime.costBreakdown.tempOutOfRange += d * f;
  this.stats.thisLifetime.costBreakdown.totalTemp += totalCost;
  
  return totalCost;
};

Rob.Lizer.prototype.launch = function(archon) {
  this.archon = archon;
	this.accumulatedMetabolismCost = 0;
  this.parasitismBenefit = 0;
		
	this.optimalTempRange = new Rob.Range(this.archon.optimalLoTemp, this.archon.optimalHiTemp);
  
  for(var i in this.stats.thisLifetime) {
    if(i === 'costBreakdown') {
      for(var j in this.stats.thisLifetime.costBreakdown) {
        this.stats.thisLifetime.costBreakdown[j] = 0;
      }
    } else {
      this.stats.thisLifetime[i] = 0;
    }
  }

  // Right now we aren't using these, as we don't have fixed lifetimes.
  // Usually someone will eat us, or we'll starve to death, before we
  // get a chance to grow old
  this.lifetime = 0;
	this.expirationDate = this.lifetime + this.archon.frameCount;

  this.calorieBudget = Rob.globals.adultFatAtBirth;
  this.babyCalorieBudget = Rob.globals.babyFatAtBirth;
  this.embryoCalorieBudget = 0;
  
  // In addition to the calories I give to my offspring from the
  // embryo, I also expend a certain amount of energy by giving birth
  this.whatILoseWhenIReproduce = this.archon.offspringEnergy * Rob.globals.costFactorForGivingBirth;

  this.birthThreshold = Rob.globals.adultFullPregnancyMass * this.archon.birthThresholdMultiplier;

	this.setSize();
};

Rob.Lizer.prototype.metabolize = function() {
	var cost = 0;
	var temp = this.getTemperature();
  
  this.setButtonColor(temp);
  
  cost += Rob.globals.archonSensorCost * this.archon.sensorScale;  // Sensors aren't free
  this.stats.thisLifetime.costBreakdown.sensor += cost;
  
  cost += this.getTempCost(temp);
  cost += this.getMotionCost();
  
  var accounting = cost;
  
  if(this.babyCalorieBudget > 0) {
    this.babyCalorieBudget -= cost;

    if(this.babyCalorieBudget < 0) {
      cost = -this.babyCalorieBudget;
      this.babyCalorieBudget = 0;
    }
  }

  if(this.embryoCalorieBudget > 0) {
    this.embryoCalorieBudget -= cost;

    if(this.embryoCalorieBudget < 0) {
      cost = -this.embryoCalorieBudget;
      this.embryoCalorieBudget = 0;
    }
  }
  
  if(cost > 0) {
    this.calorieBudget -= cost;
  }
  
  this.stats.thisSecond.caloriesOut += accounting;

  this.processCalorieLoss();
};

Rob.Lizer.prototype.processCalorieLoss = function() {
  if(this.calorieBudget < Rob.globals.archonMassRange.lo) {

    this.archon.sprite.kill(); this.archon.button.kill(); this.archon.sensor.kill();
    Rob.globals.dailyDeathCounter++;

  } else {

		this.setSize();

	}
};

Rob.Lizer.prototype.setButtonColor = function(temp) {
	temp = Rob.clamp(temp, this.archon.optimalLoTemp, this.archon.optimalHiTemp);
	
	var hue = Rob.globals.buttonHueRange.convertPoint(temp, this.optimalTempRange);
	var hsl = 'hsl(' + Math.floor(hue) + ', 100%, 50%)';
	var rgb = Rob.tinycolor(hsl).toHex();
	var tint = parseInt(rgb, 16);

	this.archon.button.tint = tint;
};

Rob.Lizer.prototype.setSize = function() {
  this.archon.setSize(true);
};

Rob.Lizer.prototype.tick = function(frameCount) {
  if(this.frameCount % 60 === 0) {
    for(var i in this.stats.thisLifetime) {
      if(this.stats.thisSecond.hasOwnProperty(i)) {
        this.stats.thisLifetime[i] += this.stats.thisSecond[i];
        this.stats.thisSecond[i] = 0;
      }
    }
  }
  
  this.frameCount = frameCount;
	this.metabolize();
};
