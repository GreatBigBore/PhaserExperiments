/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game, Phaser */

"use strict";

var Rob = Rob || {};

if(typeof window === "undefined") {
  Rob = require('./XY.js');
}

(function(Rob) {

// Have to delay creation of the prototype because it needs XY,
// which doesn't exist until later, when XY.js gets loaded
var generateArchonoidPrototype = function() { 
  Rob.Archonoid = function(archonite) { this.archonite = archonite; Rob.XY.call(this); };

  Rob.Archonoid.prototype = Object.create(Rob.XY.prototype);
  Rob.Archonoid.prototype.constructor = Rob.Archonoid;

  Object.defineProperty(Rob.Archonoid.prototype, 'x', {
    get: function x() { return this.archonite.x; },
    set: function x(x) { this.archonite.x = x; }
  });

  Object.defineProperty(Rob.Archonoid.prototype, 'y', {
    get: function y() { return this.archonite.y; },
    set: function y(y) { this.archonite.y = y; }
  });
};

Rob.Archon = function(sprite, button, sensor, god) {
  this.uniqueID = -1; // Remember we need to incorporate before being usable
  this.sprite = sprite;
  this.button = button;
  this.sensor = sensor;
  this.god = god;

	sensor.archon = this;	// So we can hook back from sensors too

	sprite.anchor.setTo(0.5, 0.5); sprite.alpha = 1.0; sprite.tint = 0x00FF00; sprite.scale.setTo(0.07, 0.07);
	button.anchor.setTo(0.5, 0.5);	button.alpha = 1.0; button.tint = 0; button.scale.setTo(0.25, 0.25);
	sensor.anchor.setTo(0.5, 0.5); sensor.alpha = 0; sensor.tint = 0x0000FF; sensor.scale.setTo(1, 1);

	sprite.body.collideWorldBounds = true;
	sprite.inputEnabled = true;
	sprite.input.enableDrag();
  
  this.activatePhysicsBodies();
  
  generateArchonoidPrototype();
  
  this.position = new Rob.Archonoid(this.sprite);
  this.velocity = new Rob.Archonoid(this.sprite.body.velocity);

	this.stopped = false;
};

Rob.Archon.prototype.activatePhysicsBodies = function() {
	var enable = function(c) {
		game.physics.enable(c, Phaser.Physics.ARCADE);

		c.body.syncBounds = true;
		c.body.bounce.setTo(0, 0);
	};

	enable(this.sprite);
	this.setSize(Rob.globals.standardBabyMass);

	enable(this.sensor);
  
  this.sensorRadius = this.sensor.width / 2;

	this.sensor.body.setSize(this.sensorRadius, this.sensorRadius);
	this.sensor.body.setCircle(this.sensorRadius);
};

Rob.Archon.prototype.breed = function(parent, offspringMass) {
  this.god.breed(parent, offspringMass);
};

Rob.Archon.prototype.fetch = function(newUniqueID) {
	if(this.uniqueID === -1) {
    // Final setup before we can launch into the
    // world for the first time
		this.readyForLaunch = true;

    this.organs = {
      dna: new Rob.DNA(),           // Alpha order is good, but dna has to come first
      accel: new Rob.Accel(),
      lizer: new Rob.Lizer(),
      locator: new Rob.Locator(),
      mover: new Rob.Mover(),
      motioner: new Rob.Motioner(),
      parasite: new Rob.Parasite(),
      temper: new Rob.Temper()
    };
    
    for(var i in this.organs) {
      this.organs[i].ready(this);
    }
	}

	this.justBorn = true;	// Tells motioner to aim me away from parent (don't think this really works)

	this.uniqueID = newUniqueID;
  
  return this;
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

Rob.Archon.prototype.launch = function(birthWeight) {
  this.frameCount = 0;
  this.birthWeight = birthWeight;
  
  for(var i in this.organs) {
    this.organs[i].launch();
  }

	this.sprite.revive(); this.button.revive(); this.sensor.revive();
};

Rob.Archon.prototype.setPosition = function(a1, a2) {
  this.position.set(a1, a2);
};

Rob.Archon.prototype.setVelocity = function(a1, a2) {
  this.velocity.set(a1, a2);
};

Rob.Archon.prototype.setSize = function(mass) {
	var p = Rob.globals.archonSizeRange.convertPoint(mass, Rob.globals.archonMassRange);

	this.sprite.scale.setTo(p, p);

	var w = this.sprite.width;	// Have to tell the body to keep up with the sprite
	this.sprite.body.setSize(w, w);
	this.sprite.body.setCircle(w / 2);
};

Rob.Archon.prototype.tick = function() {
  this.frameCount++;

  this.sensor.x = this.sprite.x; // So the sensor will stay attached
  this.sensor.y = this.sprite.y; // So the sensor will stay attached
  
  for(var i in this.organs) {
    this.organs[i].tick(this.frameCount);
  }
};

})(Rob);

if(typeof window === "undefined") {
  module.exports = Rob;
}
