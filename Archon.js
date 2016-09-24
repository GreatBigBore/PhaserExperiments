/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global Proxy */

"use strict";

var Rob = Rob || {};
var game = game || {}, sprite = sprite || {}, Phaser = Phaser || {};

if(typeof window === "undefined") {
  Rob = require('./Rob.js');

  game = require('./PhaserMockups/game.js');
  sprite = require('./PhaserMockups/sprite.js');

  Phaser = require('./PhaserMockups/Phaser.js');
  
  Rob.Genomer = require('./Genomer.js');
  Rob.XY = require('./XY.js');
  Rob.Range = require('./Range.js');
  
  Rob.preGameInit();
}

(function(Rob) {
  
// Have to delay creation of the prototype because it needs XY,
// which doesn't exist until later, when XY.js gets loaded
var generateArchonoidPrototype = function() { 
  if(Rob.Archonoid === undefined) {
    Rob.Archonoid = function(archonite) { this.archonite = archonite; Rob.XY.call(this); };

    Rob.Archonoid.prototype = Object.create(Rob.XY.prototype);
    Rob.Archonoid.prototype.constructor = Rob.Archonoid;

    Object.defineProperty(Rob.Archonoid.prototype, 'x', {
      get: function x() { return this.archonite.x; },
      set: function x(v) { this.archonite.x = v; }
    });

    Object.defineProperty(Rob.Archonoid.prototype, 'y', {
      get: function y() { return this.archonite.y; },
      set: function y(v) { this.archonite.y = v; }
    });
  }
};

Rob.Archon = function(god, phaseron) {
  this.firstLaunch = true;
  this.sprite = phaseron;
  this.button = phaseron.button;
  this.sensor = phaseron.sensor;  this.sensor.archon = this;
  this.whichArchonReport = 0;
  this.god = god;
  
  var p = phaseron, b = p.button, s = p.sensor;

	p.anchor.setTo(0.5, 0.5); p.alpha = 1.0; p.tint = 0x00FF00; p.scale.setTo(0.07, 0.07);
	b.anchor.setTo(0.5, 0.5);	b.alpha = 1.0; b.tint = 0;        b.scale.setTo(0.25, 0.25);
	s.anchor.setTo(0.5, 0.5); s.alpha = 0.0; s.tint = 0x0000FF;  // s scale set in launch

	p.body.collideWorldBounds = true; p.inputEnabled = true; p.input.enableDrag();
  
  this.activatePhysicsBodies();
  
  generateArchonoidPrototype(); // This happens only once
  
  this.position = new Rob.Archonoid(p);
  this.velocity = new Rob.Archonoid(p.body.velocity);
  
  Rob.globals.archonia.genomer.genomifyMe(this); // No inheritance here; just getting a skeleton genome
  
  this.organs = {
    accel: new Rob.Accel(),
    lizer: new Rob.Lizer(),
    locator: new Rob.Locator(),
    mover: new Rob.Mover(),
    temper: new Rob.Temper(game.width / 2)
  };
  
  for(var organ in this.organs) {
    this[organ] = new Proxy(this.organs[organ], { 
      get: function(target, name) { if(name in target) { return target[name]; }  else { debugger; } } // jshint ignore: line
    });
  }
};

Rob.Archon.prototype.activatePhysicsBodies = function() {
	var enable = function(c) {
		game.physics.enable(c, Phaser.Physics.ARCADE);

		c.body.syncBounds = true;
		c.body.bounce.setTo(0, 0);
	};

	enable(this.sprite);
	this.setSize(Rob.globals.massOfMiracleBabies);

	enable(this.sensor);
  
  this.sensorWidth = this.sensor.width;
  this.sensorRadius = this.sensor.width / 2;

	this.sensor.body.setSize(this.sensorRadius, this.sensorRadius);
	this.sensor.body.setCircle(this.sensorRadius);
};

Rob.Archon.prototype.breed = function() {
  if(!this.isDisabled) {
    this.howManyChildren++;
    this.god.breed(this);
  }
};

Rob.Archon.prototype.getPosition = function() {
  return this.position;
};

Rob.Archon.prototype.getSize = function() {
  return this.sprite.width;
};

Rob.Archon.prototype.getVelocity = function() {
  return this.velocity;
};

Rob.Archon.prototype.launch = function(myParentArchon) {
  Rob.globals.archonia.genomer.inherit(this, myParentArchon);
  
  this.isParasite = this.god.decreesYouAParasite(myParentArchon);
  
  this.myParentArchon = myParentArchon;
  this.frameCount = Rob.integerInRange(0, 60);
  this.whichFlash = 'birth';
  this.flashDuration = 0.5 * 60;
  this.flashInterval = 5;
  this.flashExpiration = this.frameCount + this.flashDuration; // Flash birth for five seconds
  this.howManyChildren = 0;
  this.flashDirection = -1;
  this.isDisabled = false;
  this.isDefending = false;
  this.injuryFactor = 0;
  
  this.flashes = {
    birth: { on: 0xFFFFFF, off: 0 },
    defending: { on: 0xFF0000, off: 0x0000FF }
  };

	this.uniqueID = this.god.getUniqueID();
  if(this.uniqueID === 0) {
    this.sprite.tint = 0x00FFFF;  // For debugging, so I can see archon 0
  }
  
  this.sensor.scale.setTo(this.sensorScale, this.sensorScale);  

  this.accel.launch(this);
  this.lizer.launch(this);
  this.locator.launch(this);
  this.temper.launch(this);
  this.mover.launch(this);
  
  if(myParentArchon === undefined) {
    this.position.set(Rob.integerInRange(20, game.width - 20), Rob.integerInRange(20, game.height - 20));
    Rob.globals.archonia.familyTree.addMe(this.uniqueID, 'god');
  } else {
    this.position.set(myParentArchon.position);
    Rob.globals.archonia.familyTree.addMe(this.uniqueID, myParentArchon.uniqueID);
  }

  this.firstLaunch = false;

	this.sprite.revive(); this.button.revive(); this.sensor.revive();
};

Rob.Archon.prototype.setPosition = function(a1, a2) {
  this.position.set(a1, a2);
};

Rob.Archon.prototype.setVelocity = function(a1, a2) {
  this.velocity.set(a1, a2);
};

Rob.Archon.prototype.getSize = function() {
  return this.sprite.width / Rob.rg.bm.width;
};

Rob.Archon.prototype.setSize = function(mass) {
	var p = Rob.globals.archonSizeRange.convertPoint(mass, Rob.globals.archonMassRange);

	this.sprite.scale.setTo(p, p);

	var w = this.sprite.width;	// Have to tell the body to keep up with the sprite
	this.sprite.body.setSize(w, w);
	this.sprite.body.setCircle(w / 2);
};

Rob.Archon.prototype.throttle = function(id, interval, callback, context) {
  if(this.uniqueID === id && this.frameCount % interval === 0) {
    callback.call(context);
  }
};

Rob.Archon.prototype.tick = function() {
  this.frameCount++;
  
  if(this.isDefending) {
    this.flashExpiration = this.frameCount + this.flashDuration;
    this.whichFlash = 'defending';
    this.isDefending = false;
    this.flashDirection = 1;
  }
  
  if((this.flashExpiration - this.frameCount) % this.flashInterval === 0) {
    this.flashDirection *= -1;
  }
  
  if(this.frameCount > this.flashExpiration) {
    this.flashDirection = 0;
  }
  
  if(this.flashDirection === 1) {
    this.sprite.tint = this.flashes[this.whichFlash].on;
  } else if(this.flashDirection === -1) {
    this.sprite.tint = this.flashes[this.whichFlash].off;
  } else {
    this.sprite.tint = this.color;
  }
  
  // If I've been injured so badly (or was born with a serious defect),
  // then everyone can see me as injured. This doesn't matter unless
  // I'm a parasite. Normally, a parasite is immune to parasitism;
  // other parasites will leave me alone. But when they see my
  // injury they'll come after me
  if(this.maxMVelocity < Rob.globals.maxMagnitudeV / 5) {
    this.isDisabled = true;
  }

  this.sensor.x = this.sprite.x; // So the sensor will stay attached
  this.sensor.y = this.sprite.y; // So the sensor will stay attached
  
  this.accel.tick(this.frameCount);
  this.lizer.tick(this.frameCount);
  this.locator.tick(this.frameCount);
  this.mover.tick(this.frameCount);
};

})(Rob);

if(typeof window === "undefined") {
  module.exports = Rob;
}
