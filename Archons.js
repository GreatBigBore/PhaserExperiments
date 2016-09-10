/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game, Phaser, Rob */

"use strict";

Rob.Archons = function() {
	this.archonUniqueID = 0;

	this.archonPool = null;
	this.buttonPool = null;
	this.sensorPool = null;

	this.initialize();
};

Rob.Archons.prototype.breed = function(parent, birthWeight) {
	var a = this.archonPool.getFirstDead();
	if(a === null) {
		throw "No more archons in pool";
	}

	if(parent === undefined) {
		// totally arbitrary, just staying within the bounds of the world
		var center = game.width / 2;
		var maxDFromCenter = game.width / 2 - 20;

		a.x = Rob.integerInRange(center - maxDFromCenter, center + maxDFromCenter);
		a.y = Rob.integerInRange(center - maxDFromCenter, center + maxDFromCenter);
	} else {
		a.x = parent.sprite.x; a.y = parent.sprite.y;
	}

	if(birthWeight === undefined) { birthWeight = Rob.globals.standardBabyMass; }
	this.ensoul(a, parent, birthWeight);

	a.revive(); a.archon.button.revive(); a.archon.sensor.revive();

	return a.archon;
};

Rob.Archons.prototype.enablePhysicsBodies = function() {
	var enable = function(c) {
		game.physics.enable(c, Phaser.Physics.ARCADE);

		c.body.syncBounds = true;
		c.body.bounce.setTo(0, 0);
	};

	this.archonPool.forEach(function(a) {

		enable(a);
		this.setSize(a, Rob.globals.standardBabyMass);

		enable(a.archon.sensor);

		var radius = a.archon.sensor.width / 2;
		a.archon.sensor.body.setSize(radius, radius);
		a.archon.sensor.body.setCircle(radius);
	}, this);
};

Rob.Archons.prototype.ensoul = function(sprite, parent, birthWeight) {
	if(sprite.archon === undefined) { throw "How did we get a sprite with no archon?"; }

	sprite.archon.justBorn = true;	// Allows motioner to launch them away from parent

	if(!sprite.archon.ensouled) {
		sprite.archon.uniqueID = this.archonUniqueID++;
		sprite.archon.ensouled = true;
		sprite.archon.god = this;
		sprite.archon.sprite = sprite;

		// This is how we get access to our stuff when resurrecting
		// a sprite. The archon object on the sprite points to
		// all of our other objects.
		sprite.archon.dna = new Rob.DNA();
		sprite.archon.mover = new Rob.Mover();
	  sprite.archon.motioner = new Rob.Motioner();
		sprite.archon.lizer = new Rob.Lizer();

		sprite.archon.dna.init(sprite.archon);
		sprite.archon.mover.init(sprite.archon);
		sprite.archon.motioner.init(sprite.archon);
		sprite.archon.lizer.init(sprite.archon);
	}

	sprite.archon.dna.ensoul(parent);
	sprite.archon.mover.ensoul(parent);
	sprite.archon.motioner.ensoul(parent);
	sprite.archon.lizer.ensoul(parent, birthWeight);
};

Rob.Archons.prototype.initialize = function() {
	this.setupSpritePools();
	this.prepSpritesForLife();
	this.enablePhysicsBodies();
	//this.setupWalls();
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

		s.archon = a.archon;	// So we can hook back from sensors too

		a.anchor.setTo(0.5, 0.5); a.alpha = 1.0; a.tint = 0x00FF00; a.scale.setTo(0.07, 0.07);
		b.anchor.setTo(0.5, 0.5);	b.alpha = 1.0; b.tint = 0; b.scale.setTo(0.25, 0.25);
		s.anchor.setTo(0.5, 0.5); s.alpha = 0; s.tint = 0x0000FF; s.scale.setTo(1, 1);

		a.body.collideWorldBounds = true;
		a.inputEnabled = true;
		a.input.enableDrag();

		a.archon.stopped = false;
	}, this);
};

Rob.Archons.prototype.render = function() {
	var showDebugOutlines = false;

	if(showDebugOutlines) {
		this.archonPool.forEachAlive(function(a) {
	  	game.debug.body(a, 'yellow', false);
		//	game.debug.body(a.archon.sensor, 'blue', false);

			game.debug.spriteBounds(a, 'blue', false);
	  //  game.debug.spriteBounds(a.archon.sensor, 'magenta', false);
		}, this);
	}
};

Rob.Archons.prototype.setSize = function(sprite, mass) {
	var p = Rob.globals.archonSizeRange.convertPoint(mass, Rob.globals.archonMassRange);
	sprite.scale.setTo(p, p);

	var w = sprite.width;	// Have to tell the body to keep up with the sprite
	sprite.body.setSize(w, w);
	sprite.body.setCircle(w / 2);
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

Rob.Archons.prototype.setupWalls = function() {
	this.cursors = game.input.keyboard.createCursorKeys();

	this.wallsGroup = game.add.group();
	this.wallsGroup.enableBody = true;

	var b = Rob.globals.worldBorder;
	var h = b / 2;

	game.world.setBounds(-h, -h, game.width + b, game.height + b);
	game.camera.x = -h;
	game.camera.y = -h;
	var wallsConfig = [
		{ position: { x: -b, y: -b }, scale: { x: game.width + b, y: b }, anchor: { x: 0, y: 0 } },

		{ position: { x: game.width - b, y: -h }, scale: { x: b, y: game.height + b }, anchor: { x: 0, y: 0 } },

		{ position: { x: -b, y: game.height - b }, scale: { x: game.width + b, y: b }, anchor: { x: 0, y: 0 } },

		{ position: { x: -b, y: -h }, scale: { x: b, y: game.height + b }, anchor: { x: 0, y: 0 } }
	];

	for(var i = 0; i < wallsConfig.length; i++) {
		var s = game.add.sprite(
			wallsConfig[i].position.x, wallsConfig[i].position.y,
			game.cache.getBitmapData('wallsGoo')
		);

		this.wallsGroup.add(s);

    s.tint = 0;
    s.inputEnabled = true;
    s.input.enableDrag();

		s.anchor.setTo(wallsConfig[i].anchor.x, wallsConfig[i].anchor.y);
    s.scale.setTo(wallsConfig[i].scale.x, wallsConfig[i].scale.y);

		s.body.collideWorldBounds = true;
    s.body.bounce.setTo(1, 1);
    s.body.immovable = true;
	}

	game.world.bringToTop(this.wallsGroup);
};

Rob.Archons.prototype.update = function() {
	this.archonPool.forEachAlive(function(a) {
		a.archon.mover.update();
		a.archon.lizer.update();
	});
};
