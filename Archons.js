/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game, Phaser, Rob */

"use strict";

Rob.Archons = function() {
	this.archonPool = null;
	this.buttonPool = null;
	this.sensorPool = null;

	this.initialize();
};

Rob.Archons.prototype.breed = function(parent) {
	var a = this.archonPool.getFirstDead();
	if(a === null) {
		throw "No more archons in pool";
	}

	var center = game.width / 2;
	a.x = center; a.y = center;

	a.archon.ensoul(a, parent);

	a.revive(); a.archon.button.revive(); a.archon.sensor.revive();
};

Rob.Archons.prototype.enablePhysicsBodies = function() {
	var enable = function(c) {
		game.physics.enable(c, Phaser.Physics.ARCADE);

		var radius = c.width / 2;
		c.body.setCircle(radius, 0, 0);
		c.body.syncBounds = true;

		c.body.bounce.setTo(0, 0);
	};

	this.archonPool.forEach(function(a) {
		enable(a);
		enable(a.archon.sensor);
	}, this);
};

Rob.Archons.prototype.ensoul = function(sprite, parent) {
	if(sprite.archon === undefined) { throw "How did we get a sprite with no archon?"; }

	if(!sprite.archon.ensouled) {
		// This is how we get access to our stuff when resurrecting
		// a sprite. The archon object on the sprite points to
		// all of our other objects.
		sprite.archon.dna = new Rob.DNA(sprite, parent);
		sprite.archon.mover = new Rob.Mover(sprite, parent);
		sprite.archon.lizer = new Rob.Lizer(sprite, parent);
	}

	sprite.archon.dna.ensoul(parent);
	sprite.archon.mover.ensoul(parent);
	sprite.archon.lizer.ensoul(parent);
};

Rob.Archons.prototype.initialize = function() {
	this.setupSpritePools();
	this.prepSpritesForLife();
	this.enablePhysicsBodies();
};

Rob.Archons.prototype.prepSpritesForLife = function() {
	this.archonPool.forEach(function(a) {
		var ix = this.archonPool.getIndex(a);
		var s = this.sensorPool.getChildAt(ix);

		game.physics.enable(a, Phaser.Physics.ARCADE);
		game.physics.enable(s, Phaser.Physics.ARCADE);

		// Always get the one at zero, because the addChild() below
		// removes this one from the pool
		var b = this.buttonPool.getChildAt(0);
		a.addChild(b);	// b is removed from its pool by this call

		// This is how we retain the soul of the sprite, not
		// allowing it to run off into limbo
		a.archon = {
			ensouled: false,
			button: b,
			sensor: s
		};

		a.anchor.setTo(0.5, 0.5); a.alpha = 1.0; a.tint = 0x00FF00; a.scale.setTo(0.07, 0.07);
		b.anchor.setTo(0.5, 0.5);	b.alpha = 1.0; b.tint = 0; b.scale.setTo(0.25, 0.25);
		s.anchor.setTo(0.5, 0.5); s.alpha = 0; s.tint = 0x0000FF; s.scale.setTo(1, 1);

		a.body.collideWorldBounds = true;
		a.inputEnabled = true;
		a.input.enableDrag();
	}, this);
};

Rob.Archons.prototype.render = function() {
	var showDebugOutlines = false;

	if(showDebugOutlines) {
		this.archonPool.forEachAlive(function(a) {
	  	game.debug.body(a, 'yellow', false);
			//game.debug.body(a.sensor, 'blue', false);

			game.debug.spriteBounds(a, 'blue', false);
	    //game.debug.spriteBounds(a.sensor, 'magenta', false);
		}, this);
	}
};

Rob.Archons.prototype.setSize = function(archon, mass) {
	var p = Rob.globals.archonSizeRange.convertPoint(mass, Rob.globals.archonMassRange);
	archon.scale.setTo(p, p);

	// Don't know why, but we have to use the diameter here, or we end
	// up with a circle half the size we want. Ok, whatever
	archon.body.setCircle(archon.body.width, 0, 0);

	//Rob.db.text(0, 0, "Mass: " + mass.toFixed(4) + ", scale: " + p.toFixed(4));
};

Rob.Archons.prototype.setupSpritePools = function() {
	var setupPool = function(t, whichPool) {
		t[whichPool] = game.add.group();
	  t[whichPool].enableBody = true;
	  t[whichPool].createMultiple(1000, game.cache.getBitmapData('realityGoo'), 0, false);
	  game.physics.enable(t[whichPool], Phaser.Physics.ARCADE);
	};

	setupPool(this, 'archonPool');
	setupPool(this, 'buttonPool');
	setupPool(this, 'sensorPool');
};

Rob.Archons.prototype.update = function() {
	this.archonPool.forEachAlive(function(a) {
		a.archon.mover.update();
	});
};
