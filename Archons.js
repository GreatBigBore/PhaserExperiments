/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game, Phaser, Rob */

"use strict";

Rob.Archons = function() {
  Rob.globals.archonia.archons = this;
	this.archonUniqueID = 0;

	this.phaseronPool = null;
	this.buttonPool = null;
	this.sensorPool = null;

  this.makeArchonGetters();
	this.setupSpritePools();
	this.constructPhaserons();
  
  this.report = new Rob.Report(this.phaseronPool);

  Rob.globals.creation = true;
	for(var i = 0; i < Rob.globals.archonCount; i++) {
    this.breed();
  }
  Rob.globals.creation = false;
};

Rob.Archons.prototype.makeArchonGetters = function() {
  var keys = Object.keys(Rob.Genomer.prototype.primordialGenome).concat(
    'optimalHiTemp', 'optimalLoTemp', 'optimalTemp'
  );
  
  for(var i in Rob.Genomer.prototype.primordialGenome) {
    switch(i) {
    case 'color':
      Object.defineProperty(Rob.Archon.prototype, i, { get: function () {
        return this.genome.color.getColorAsDecimal(); 
      }});
      break;
      
    case 'optimalHiTemp':
      Object.defineProperty(Rob.Archon.prototype, i, { get: function () {
        return this.genome.color.getOptimalHiTemp(); 
      }});
      break;
      
    case 'optimalLoTemp':
      Object.defineProperty(Rob.Archon.prototype, i, { get: function () {
        return this.genome.color.getOptimalLoTemp(); 
      }});
      break;
      
    case 'optimalTemp':
      Object.defineProperty(Rob.Archon.prototype, i, { get: function () {
        var t = this.genome.color.getOptimalTemp();
        return t;
      }});
      break;
      
    case 'embryoThresholdMultiplier':
      Object.defineProperty(Rob.Archon.prototype, i, { get: function() {
        return this.genome.embryoThresholdMultiplier.value;
      }});
      break;
        
    case 'hungerMultiplier':
      Object.defineProperty(Rob.Archon.prototype, i, { get: function() {
        return this.genome.hungerMultiplier.value;
      }});
      break;    
    
    case 'tempFactor':
      Object.defineProperty(Rob.Archon.prototype, i, { get: function() {
        return this.genome.tempFactor.value;
      }});
      break;
        
    case 'tasteFactor':
      Object.defineProperty(Rob.Archon.prototype, i, { get: function() {
        return this.genome.tasteFactor.value;
      }});
      break;

    case 'targetChangeDelay':
      Object.defineProperty(Rob.Archon.prototype, i, { get: function() {
        return this.genome.targetChangeDelay.value;
      }});
      break;

    case 'sensorScale':
      Object.defineProperty(Rob.Archon.prototype, i, { get: function() {
        return this.genome.sensorScale.value;
      }});
      break;

    case 'offspringMass':
      Object.defineProperty(Rob.Archon.prototype, i, { get: function() {
        return this.genome.offspringMass.value;
      }});
      break;

    case 'optimalMass':
      Object.defineProperty(Rob.Archon.prototype, i, { get: function() {
        return this.genome.optimalMass.value;
      }});
      break;

    case 'maxVelocityMagnitude':
      Object.defineProperty(Rob.Archon.prototype, i, { get: function() {
        return this.genome.maxVelocityMagnitude.value;
      }});
      break;  

    case 'maxAcceleration':
      Object.defineProperty(Rob.Archon.prototype, i, { get: function() {
        return this.genome.maxAcceleration.value;
      }});
      break;

    case 'tempRange':
      Object.defineProperty(Rob.Archon.prototype, i, { get: function() {
        return this.genome.tempRange.value;
      }});
      break;
      
    default:
      throw new TypeError("Need a getter for property '" + i + "'");
      break;
    }
  }
};

Rob.Archons.prototype.dailyReport = function(dayNumber) {
  this.report.reportAsText(dayNumber);
};

Rob.Archons.prototype.breed = function(parent, birthWeight) {
	if(birthWeight === undefined) { birthWeight = Rob.globals.standardBabyMass; }

	var p = this.phaseronPool.getFirstDead();
	if(p === null) { throw "No more phaserons in pool"; }

	if(parent === undefined) {
		p.x = Rob.integerInRange(20, game.width - 20);
		p.y = Rob.integerInRange(20, game.height - 20);
	} else {
		p.x = parent.archon.position.x; p.y = parent.archon.position.y;
	}

//	var oldID = p.archon.uniqueID;

	var a = p.archon.fetch(parent, this.archonUniqueID++);

	/*var t = "Birth: archon " + a.uniqueID;

	if(parent === undefined) {
		t += " by miracle";
	} else {
	 	t += " sprung from archon " + parent.archon.uniqueID;

		if(oldID === -1) {
			t += "; first launch";
		} else {
			t += "; recycled from " + oldID;
		}
	}

	console.log(t);*/
  
  var parentArchon = (parent === undefined) ? parent : parent.archon;
  a.launch(parentArchon, birthWeight);
};

Rob.Archons.prototype.dumpGenePool = function() {
	var genePool = [];
	this.phaseronPool.forEachAlive(function(p) {
		genePool.push(p.archon.organs.genome);
	});

	console.log(genePool);
};

Rob.Archons.prototype.constructPhaserons = function() {
	this.phaseronPool.forEach(function(a) {
		var ix = this.phaseronPool.getIndex(a);
		var s = this.sensorPool.getChildAt(ix);

		game.physics.enable(a, Phaser.Physics.ARCADE);
		game.physics.enable(s, Phaser.Physics.ARCADE);

		// Always get the one at zero, because the addChild() below
		// removes this one from the pool
		var b = this.buttonPool.getChildAt(0);
		a.addChild(b);	// b is removed from its pool by this call
    
		// This is how we retain the soul of the sprite, not
		// allowing it to run off into limbo
		a.archon = new Rob.Archon(a, b, s, this);
	}, this);
};

Rob.Archons.prototype.render = function() {
	var showDebugOutlines = false;

	if(showDebugOutlines) {
		this.phaseronPool.forEachAlive(function(a) {
	    game.debug.body(a, 'yellow', false);
		  game.debug.body(a.archon.sensor, 'blue', false);

			game.debug.spriteBounds(a, 'blue', false);
	    game.debug.spriteBounds(a.archon.sensor, 'magenta', false);
		}, this);
	}
};

Rob.Archons.prototype.setupSpritePools = function() {
	var setupPool = function(t, whichPool) {
		t[whichPool] = game.add.group();
	  t[whichPool].enableBody = true;
	  t[whichPool].createMultiple(1000, game.cache.getBitmapData('realityGoo'), 0, false);
	  game.physics.enable(t[whichPool], Phaser.Physics.ARCADE);
	};

	setupPool(this, 'sensorPool');
	setupPool(this, 'phaseronPool');
	setupPool(this, 'buttonPool');
};

Rob.Archons.prototype.tick = function() {
	this.phaseronPool.forEachAlive(function(a) {
    a.archon.tick();
	});
};
