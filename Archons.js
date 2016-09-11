/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game, Phaser, Rob */

"use strict";

Rob.Archons = function() {
	this.archonUniqueID = 0;

	this.phaseronPool = null;
	this.buttonPool = null;
	this.sensorPool = null;

	this.initialize();
};

Rob.Archons.prototype.breed = function(parent, birthWeight) {
	if(birthWeight === undefined) { birthWeight = Rob.globals.standardBabyMass; }

	var p = this.phaseronPool.getFirstDead();
	if(p === null) { throw "No more phaserons in pool"; }

	if(parent === undefined) {
		p.x = Rob.integerInRange(20, game.width - 20);
		p.y = Rob.integerInRange(20, game.height - 20);
	} else {
		p.x = parent.sprite.x; p.y = parent.sprite.y;
	}

	var a = this.archonate(p);	// Make sure this phaseron has an archon

	a.justBorn = true;	// Tells motioner to aim them away from parent
	a.uniqueID = this.archonUniqueID++;

	a.dna.launch(parent);
	a.mover.launch(parent);
	a.motioner.launch(parent);
	a.lizer.launch(parent, birthWeight);

	p.revive(); a.button.revive(); a.sensor.revive();

	return a;
};

Rob.Archons.prototype.activatePhysicsBodies = function() {
	var enable = function(c) {
		game.physics.enable(c, Phaser.Physics.ARCADE);

		c.body.syncBounds = true;
		c.body.bounce.setTo(0, 0);
	};

	this.phaseronPool.forEach(function(a) {

		enable(a);
		this.setSize(a, Rob.globals.standardBabyMass);

		enable(a.archon.sensor);

		var radius = a.archon.sensor.width / 2;
		a.archon.sensor.body.setSize(radius, radius);
		a.archon.sensor.body.setCircle(radius);
	}, this);
};

Rob.Archons.prototype.archonate = function(sprite) {
	var a = sprite.archon;

	if(a.uniqueID === undefined) {
		a.uniqueID = 0;
		a.launched = true;
		a.god = this;
		a.sprite = sprite;

		a.dna = new Rob.DNA();
		a.mover = new Rob.Mover();
	  a.motioner = new Rob.Motioner();
		a.lizer = new Rob.Lizer();

		a.dna.init(a);
		a.mover.init(a);
		a.motioner.init(a);
		a.lizer.init(a);
	}

	return a;
};

Rob.Archons.prototype.initialize = function() {
	this.setupSpritePools();
	this.constructPhaserons();
	this.activatePhysicsBodies();
	//this.setupWalls();

	for(var i = 0; i < Rob.globals.archonCount; i++) {
    this.breed();
  }
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
		a.archon = { sprite: a, button: b, sensor: s};

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
		this.phaseronPool.forEachAlive(function(a) {
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

	setupPool(this, 'phaseronPool');
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
	this.phaseronPool.forEachAlive(function(a) {
		a.archon.mover.update();
		a.archon.lizer.update();
	});
};
