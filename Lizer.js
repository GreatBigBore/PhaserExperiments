/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global Rob */

"use strict";

Rob.Lizer = function(archon) {
  this.archon = archon;
  this.frameCount = 0;
  
  this.mannaNutritionRange =
  	new Rob.Range(Rob.globals.caloriesPerMannaMorsel, 4 * Rob.globals.caloriesPerMannaMorsel);
    
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

  this.absorbCalories(calories);
  
  this.stats.thisLifetime.grazing += calories;
};

Rob.Lizer.prototype.absorbCalories = function(calories) {
  this.calorieBudget += calories;
  this.stats.thisSecond.caloriesIn += calories;
  
  if(this.calorieBudget > this.birthThreshold) {
    this.archon.breed();
    this.calorieBudget -= this.costForHavingBabies;
  }
  
	this.archon.setSize(this.getMass());
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
    this.archon.injuryFactor = 0.005;
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

Rob.Lizer.prototype.getMass = function() {
  return this.calorieBudget / Rob.globals.fatCalorieDensity;
};

Rob.Lizer.prototype.getMotionCost = function() {
  var c = 0, d = 0, e = 0, motion = this.archon.accel.getMotion();
  
  d = motion.mVelocity * Rob.globals.nominalCostPerMagnitudeV;
  e = motion.mAcceleration * Rob.globals.nominalCostPerMagnitudeA;

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
  
	// Costs for keeping the body warm, for moving, and
	// for simply maintaining the body
	c += Math.abs(temp - this.archon.optimalTemp) * Rob.globals.nominalCostPerInRangeTemp;
  
  if(temp > this.archon.optimalHiTemp) {
    d = temp - this.archon.optimalHiTemp;
  } else if(temp < this.archon.optimalLoTemp) {
    d = this.archon.optimalLoTemp - temp;
  }
  
  d *= Rob.globals.nominalCostPerExcessTemp;  // Temps outside your range cost more than normal
  
  // There's also a cost for having the ability to tolerate wide temperature ranges
  var geneticTempRange = this.archon.optimalHiTemp - this.archon.optimalLoTemp;
  var standardTempRange = Rob.globals.standardArchonTolerableTempRange.hi - Rob.globals.standardArchonTolerableTempRange.lo;

  if(geneticTempRange > standardTempRange) {
    d *= geneticTempRange / standardTempRange;
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
	this.calorieBudget = 0;
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

  var caloriesIHaveAtLaunch = (
    this.archon.myParentArchon === undefined ?
    Rob.globals.massOfMiracleBabies :
    this.archon.myParentArchon.offspringMass
  ) * Rob.globals.fatCalorieDensity;
  
  // This is how many calories we start life with
  this.calorieBudget = caloriesIHaveAtLaunch * Rob.globals.costFactorForBeingBorn;
  this.masslessCaloriesForBaby = Rob.globals.miracleCalories;

  // In addition to the calories I give to my offspring from the
  // embryo, I also expend a certain amount of energy by giving birth
	this.costForHavingBabies = this.archon.offspringMass * Rob.globals.fatCalorieDensity * Rob.globals.costFactorForGivingBirth;
  
  // This is how many calories my embryo must contain before it can produce an offspring
  this.birthThreshold = (
    (this.costForHavingBabies + (Rob.globals.archonMassRange.lo * Rob.globals.fatCalorieDensity)) *
    this.archon.birthThresholdMultiplier
  );

	this.archon.setSize(this.getMass());
};

Rob.Lizer.prototype.metabolize = function() {
	var cost = 0;
	var temp = this.getTemperature();
  
  this.setButtonColor(temp);
  
  cost += Rob.globals.archonSensorCost * this.archon.sensorScale;  // Sensors aren't free
  this.stats.thisLifetime.costBreakdown.sensor += cost;
  
  cost += this.getTempCost(temp);
  cost += this.getMotionCost();
  
  if(this.masslessCaloriesForBaby > 0) {
    this.masslessCaloriesForBaby -= cost;
    
    if(this.masslessCaloriesForBaby < 0) {
      cost -= this.masslessCaloriesForBaby;
    } else {
      cost = 0;
    }
  }
  
	this.calorieBudget -= cost;
  this.stats.thisSecond.caloriesOut += cost;

  if(this.calorieBudget < Rob.globals.archonMassRange.lo) {

    this.archon.sprite.kill(); this.archon.button.kill(); this.archon.sensor.kill();
    Rob.globals.dailyDeathCounter++;

  } else {

		this.archon.setSize(this.getMass());

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
