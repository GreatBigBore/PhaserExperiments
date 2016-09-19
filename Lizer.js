/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global Rob */

"use strict";

Rob.Lizer = function(archon) {
  this.archon = archon;
  
  this.mannaNutritionRange =
  	new Rob.Range(Rob.globals.caloriesPerMannaMorsel, 5 * Rob.globals.caloriesPerMannaMorsel);
  };

Rob.Lizer.prototype.doLog = function(id, interval) {
  return this.archon.uniqueID === id && this.frameCount % interval === 0;
};

Rob.Lizer.prototype.absorbCalories = function(calories) {
  if(this.adultCalorieBudget > this.embryoThreshold) {
    // Store up for breeding if we have enough reserves already
    this.embryoCalorieBudget += calories;

		if(this.embryoCalorieBudget >= this.costForHavingBabies) {
			this.archon.breed();
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
  
  this.archon.throttle(0, 1, function() {
    roblog('calories', 'just absorbed', calories);
  }, this);

	this.archon.setSize(this.getMass());
}

Rob.Lizer.prototype.eat = function(foodParticle) {
  // Once we've caught the food, tell the mover
  // and the accel that we're ready to move again
  this.archon.mover.noNewTargetUntil = 0;
  this.archon.accel.maneuverComplete = true;
  
  foodParticle.kill();
  
	var sunStrength = Rob.globals.archonia.sun.getStrength();
	var calories = this.mannaNutritionRange.convertPoint(sunStrength, Rob.globals.oneToZeroRange);

  this.absorbCalories(calories);
};

Rob.Lizer.prototype.ffAction = function(preyHopefully) {
  // We don't eat our children, although we will eat anyone else, siblings, grandchildren, etc.
  // Note that calories gained or lost per bite are measured in seconds, so we divide
  // by frames per second
  if(!this.archon.isCloseRelative(preyHopefully.archon)) {
    var myMass = this.getMass(), hisMass = preyHopefully.archon.lizer.getMass();
    if(myMass > hisMass) {
      // You don't get the full benefit of all your prey's lost calories
      this.absorbCalories(Rob.globals.caloriesGainedPerParasiteBite / 60);
    } else if(hisMass > myMass){
      this.parasitismCost += Rob.globals.caloriesLostPerParasiteBite / 60;

      // If my cost is positive, that means I'm being eaten. Tell the locator we're in trouble
      this.archon.locator.sense('ff', preyHopefully);
    }
  }
};

Rob.Lizer.prototype.howPredatoryAmI = function(baseValue) {
  this.howHungryAmI(baseValue) * Rob.caloriesGainedPerParasiteBite / Rob.caloriesPerMannaMorsel;
};

Rob.Lizer.prototype.howHungryAmI = function(baseValue) {
  var hunger = (
    (this.embryoThreshold - this.embryoCalorieBudget) * this.archon.hungerMultiplier
  );
  
  return Math.abs(baseValue * this.archon.tasteFactor * hunger);
};

Rob.Lizer.prototype.getMass = function() {
  var b = this.babyCalorieBudget / Rob.globals.babyFatCalorieDensity;
  var e = this.embryoCalorieBudget / Rob.globals.embryoCalorieDensity;
  var a = this.adultCalorieBudget / Rob.globals.adultFatCalorieDensity;
  
	return b + e + a;
};

Rob.Lizer.prototype.getMotionCost = function() {
  var motion = this.archon.accel.getMotion();
  var c = 0;
  
	c += motion.mVelocity * Rob.globals.lizerCostPerSpeed;
  c += motion.mAcceleration * Rob.globals.lizerCostPerAcceleration;

  return c;
};

Rob.Lizer.prototype.getTemperature = function() {
	return Rob.getTemperature(this.archon.position.x, this.archon.position.y);
};

Rob.Lizer.prototype.getTempCost = function(temp) {
  var c = 0, d = 0, e = 0, f = 0;
  
	// Costs for keeping the body warm, for moving, and
	// for simply maintaining the body
	c += Math.abs(temp - this.archon.optimalTemp) *
        Rob.globals.lizerCostPerTemp;
  
  // Being outside your preferred temp range costs
  // more than being inside it. Factor in the fact that
  // the cost of maintaining body temperature scales
  // up sort of logarithmically with body size
        
  if(temp > this.archon.optimalHiTemp) {
    d = temp - this.archon.optimalHiTemp;
  } else if(temp < this.archon.optimalLoTemp) {
    d = this.archon.optimalLoTemp - temp;
  }

  // Lazy! 100 is the size of the bitmap we use as sprite texture
  f = this.archon.sprite.width / 100;
  
  // For now, we'll charge 10x the normal rate
  d *= Rob.globals.lizerCostPerTemp * 10;
  
  e = 2 + (Math.log(f - (Rob.globals.archonSizeRange.lo * 0.80))) / 4;

  return c + d * e;
};

Rob.Lizer.prototype.launch = function(archon) {
  this.archon = archon;
  this.lifetime = 0;
	this.expirationDate = this.lifetime + this.archon.frameCount;
	this.adultCalorieBudget = 0;
	this.babyCalorieBudget = 0;
	this.embryoCalorieBudget = this.archon.offspringMass * Rob.globals.embryoCalorieDensity;
	this.accumulatedMetabolismCost = 0;
  this.parasitismCost = 0;
  this.parasitismBenefit = 0;

	this.costForHavingBabies = this.archon.offspringMass * Rob.globals.embryoCalorieDensity;
		
	this.optimalTempRange = new Rob.Range(this.archon.optimalLoTemp, this.archon.optimalHiTemp);

  this.embryoThreshold = (
    this.archon.embryoThresholdMultiplier *
    (
      (this.archon.offspringMass * Rob.globals.embryoCalorieDensity) +
      (this.archon.optimalMass * Rob.globals.adultFatCalorieDensity)
    )
  );

	this.archon.setSize(this.getMass());
};

Rob.Lizer.prototype.metabolize = function() {
	var cost = 0;
	var temp = this.getTemperature();
  
  this.setButtonColor(temp);
  
  cost += 0.01 * this.archon.sensorScale;  // Sensors aren't free
  
  cost += this.getTempCost(temp);
  cost += this.getMotionCost();
  cost += this.parasitismCost;
  
  this.parasitismCost = 0;      // We've taken it into account for this tick

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
		causeOfDeath = null; //causeOfDeath = 'old age';
	} else {
		this.adultCalorieBudget -= cost;
	}

	if(causeOfDeath !== null) {
		//console.log('Archon', this.archon.uniqueID, 'just died of', causeOfDeath);
		this.archon.sprite.kill();
		this.archon.button.kill();
		this.archon.sensor.kill();
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
  try {
  this.frameCount = frameCount;
	this.metabolize();
} catch(e) {}
};
