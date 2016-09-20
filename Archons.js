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

Rob.Archons.prototype.getUniqueID = function() {
  return this.archonUniqueID++;
};

Rob.Archons.prototype.makeArchonGetters = function() {
  for(var i in Rob.globals.archonia.genomer.primordialGenome) {
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
      
    default:
      Object.defineProperty(Rob.Archon.prototype, i, (
        function(propertyName) {
          return {
            get: function() { return this.genome[propertyName].value; } 
          };
        }
      )(i));
      break;
    }
  }
};

Rob.Archons.prototype.dailyReport = function(dayNumber) {
  this.report.reportAsText(dayNumber);
};

Rob.Archons.prototype.geneReport = function(dayNumber) {
  this.report.geneReport();
};

Rob.Archons.prototype.breed = function(parentArchon) {
	var phaseron = this.phaseronPool.getFirstDead();
	if(phaseron === null) { throw "No more phaserons in pool"; }
  
  if(phaseron.archon === undefined) {
    phaseron.archon = new Rob.Archon(this, phaseron);
  }
  
  phaseron.archon.launch(parentArchon);
  Rob.globals.dailyBirthCounter++;
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
    
    a.sensor = s; a.button = b; s.sprite = a;
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
