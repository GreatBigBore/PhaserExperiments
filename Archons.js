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

Rob.Archons.prototype.initialize = function() {
	var setupPool = function(t, whichPool) {
		t[whichPool] = game.add.group();
	  t[whichPool].enableBody = true;
	  t[whichPool].createMultiple(1000, game.cache.getBitmapData('realityGoo'), 0, false);
	  game.physics.enable(t[whichPool], Phaser.Physics.ARCADE);
	};

	var finalTouch = function(c) {
		game.physics.enable(c, Phaser.Physics.ARCADE);

		var radius = c.width / 2;
		c.body.setCircle(radius, 0, 0);
		c.body.syncBounds = true;

		c.body.bounce.setTo(0, 0);
	};

	setupPool(this, 'archonPool');
	setupPool(this, 'buttonPool');
	setupPool(this, 'sensorPool');

	this.archonPool.forEach(function(a) {
		var ix = this.archonPool.getIndex(a);
		var s = this.sensorPool.getChildAt(ix);

		game.physics.enable(a, Phaser.Physics.ARCADE);
		game.physics.enable(s, Phaser.Physics.ARCADE);

		// Always get the one at zero, because the addChild() below
		// removes this one from the pool
		var b = this.buttonPool.getChildAt(0);

		a.button = b;
		a.sensor = s;
		s.archon = a;

		a.addChild(b);	// b is removed from its pool by this call

		a.anchor.setTo(0.5, 0.5); a.alpha = 1.0; a.tint = 0x00FF00; a.scale.setTo(0.5, 0.5);
		b.anchor.setTo(0.5, 0.5);	b.alpha = 1.0; b.tint = 0x00FFFF; b.scale.setTo(0.1, 0.1);
		s.anchor.setTo(0.5, 0.5); s.alpha = 0.1; s.tint = 0x0000FF; s.scale.setTo(1, 1);

		a.body.collideWorldBounds = true;
		a.inputEnabled = true;
		a.input.enableDrag();

		finalTouch(a); finalTouch(s);
	}, this);
};

Rob.Archons.prototype.breed = function() {
	var a = this.archonPool.getFirstDead();
	if(a === null) {
		throw "No more archons in pool";
	}

	var center = game.width / 2;
	Rob.XY(a).set(center, center);

	if(a.mover === undefined) {
		a.mover = new Rob.Mover(a);
		a.sensor.mover = a.mover;
	}

	a.revive(); a.button.revive(); a.sensor.revive();
};

Rob.Archons.prototype.render = function() {
	var showDebugOutlines = false;

	if(showDebugOutlines) {
		this.archonPool.forEachAlive(function(a) {
	  	game.debug.body(a, 'yellow', false);
			game.debug.body(a.sensor, 'blue', false);

			game.debug.spriteBounds(a, 'black', false);
	    game.debug.spriteBounds(a.sensor, 'magenta', false);
		}, this);
	}
};

Rob.Archons.prototype.update = function() {
	this.archonPool.forEachAlive(function(a) {
		a.mover.update();
	});
};
