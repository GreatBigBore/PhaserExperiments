/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global Rob */

"use strict";

Rob.Lizer = function(archon) {
  this.archon = archon;
  
  this.mannaNutritionRange =
  	new Rob.Range(Rob.globals.caloriesPerMannaMorsel, 4 * Rob.globals.caloriesPerMannaMorsel);
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
};

Rob.Lizer.prototype.absorbCalories = function(calories) {
  this.calorieBudget += calories;
  
  if(this.calorieBudget > this.birthThreshold) {
    this.archon.breed();
    this.calorieBudget -= this.costForHavingBabies;
  }
  
	this.archon.setSize(this.getMass());
}

Rob.Lizer.prototype.ffAction = function(preyHopefully) {
  // We don't eat our children, although we will eat anyone else, siblings, grandchildren, etc.
  // Note that calories gained or lost per bite are measured in seconds, so we divide
  // by frames per second
  if(!this.archon.isCloseRelative(preyHopefully.archon)) {
    var myMass = this.getMass(), hisMass = preyHopefully.archon.lizer.getMass();
    if(myMass > hisMass) {
      // You don't get the full benefit of all your prey's lost calories
      this.absorbCalories(Rob.globals.caloriesGainedPerParasiteBite);
    } else if(hisMass > myMass){
      this.absorbCalories(-Rob.globals.caloriesLostPerParasiteBite);

      // If I'm losing calories, that means I'm being eaten. Tell the locator we're in trouble
      this.archon.locator.sense('ff', preyHopefully);
    }
  }
};

Rob.Lizer.prototype.howPredatoryAmI = function(baseValue) {
  this.howHungryAmI(baseValue) * Rob.globals.caloriesGainedPerParasiteBite / Rob.globals.caloriesPerMannaMorsel;
};

Rob.Lizer.prototype.howHungryAmI = function(baseValue) {
  var hunger = (
    (this.birthThreshold - this.calorieBudget) * this.archon.hungerMultiplier
  );
  
  return Math.abs(baseValue * this.archon.tasteFactor * hunger);
};

Rob.Lizer.prototype.getMass = function() {
  return this.calorieBudget / Rob.globals.fatCalorieDensity;
};

Rob.Lizer.prototype.getMotionCost = function() {
  var c = 0, motion = this.archon.accel.getMotion();
  
	c += motion.mVelocity * Rob.globals.costPerSpeed;
  c += motion.mAcceleration * Rob.globals.costPerAcceleration;

  return c;
};

Rob.Lizer.prototype.getTemperature = function() {
	return Rob.getTemperature(this.archon.position.x, this.archon.position.y);
};

Rob.Lizer.prototype.getTempCost = function(temp) {
  var c = 0, d = 0, e = 0, f = 0;
  
	// Costs for keeping the body warm, for moving, and
	// for simply maintaining the body
	c += Math.abs(temp - this.archon.optimalTemp) * Rob.globals.costPerTemp;
  
  if(temp > this.archon.optimalHiTemp) {
    d = temp - this.archon.optimalHiTemp;
  } else if(temp < this.archon.optimalLoTemp) {
    d = this.archon.optimalLoTemp - temp;
  }
  
  d *= Rob.globals.costPerExcessTemp;  // Temps outside your range cost more than normal

  // This will make the costs grow with size, but logarithmically
  var e = Math.floor(
    Rob.globals.oneToTenRange.convertPoint(this.archon.getSize(), Rob.globals.archonSizeRange)
  );
  
  var f = Math.pow(1.07, e);
  
  return (c + d) * f;
};

Rob.Lizer.prototype.launch = function(archon) {
  this.calorieDebug = 0;
  this.archon = archon;
	this.calorieBudget = 0;
	this.accumulatedMetabolismCost = 0;
  this.parasitismCost = 0;
  this.parasitismBenefit = 0;
		
	this.optimalTempRange = new Rob.Range(this.archon.optimalLoTemp, this.archon.optimalHiTemp);

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
  var a = cost;
  
  cost += this.getTempCost(temp);
  var b = cost - a;
  cost += this.getMotionCost();
  var c = cost - b;
  cost += this.parasitismCost;
  var d = cost - c;
  
  if(this.calorieDebug) {
    this.archon.throttle(0, 1, function() {
      roblog('ate', this.calorieDebug.toFixed(6), 'lized', a.toFixed(6), b.toFixed(6), c.toFixed(6), d.toFixed(6), 'total', cost.toFixed(6), this.getMass().toFixed(4));
    }, this);
  }
  
  this.calorieDebug = 0;
  this.parasitismCost = 0;      // We've taken it into account for this tick

	this.calorieBudget -= cost;

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
  try {
  this.frameCount = frameCount;
	this.metabolize();
} catch(e) {}
};
