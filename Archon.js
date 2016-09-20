/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

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
  this.sprite = phaseron;
  this.button = phaseron.button;
  this.sensor = phaseron.sensor;  this.sensor.archon = this;
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
      get: function(target, name) { if(name in target) { return target[name]; } else { debugger; } }
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
  this.god.breed(this);
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

Rob.Archon.prototype.isCloseRelative = function(rhsArchon) {
  if(this.myParentArchon === undefined && rhsArchon.myParentArchon === undefined) {
    // If they're both in the miracle generation, tell them not to eat each other
    return true;
  } else {
    return (
      // If they're not both miraculous, then an eating situation is
      // possible. If either one is miraculous, either one can eat
      // the other. If neither is miraculous, then it comes down to
      // whether one is the parent of the other
      this.myParentArchon === undefined ||
      rhsArchon.myParentArchon === undefined ||
      this.uniqueID === rhsArchon.myParentArchon.uniqueID ||
      this.myParentArchon.uniqueID === rhsArchon.uniqueID
    );
  }
};

Rob.Archon.prototype.launch = function(myParentArchon) {
  Rob.globals.archonia.genomer.inherit(this, myParentArchon);
  
  this.myParentArchon = myParentArchon;
  this.frameCount = Rob.integerInRange(0, 60);
  this.flashDirection = -1;

	this.uniqueID = this.god.getUniqueID();
  if(this.uniqueID === 0) {
    this.sprite.tint = 0x00FFFF;
  }
  
  this.sensor.scale.setTo(this.sensorScale, this.sensorScale);  

  this.accel.launch(this);
  this.lizer.launch(this);
  this.locator.launch(this);
  this.temper.launch(this);
  this.mover.launch(this);
  
  if(myParentArchon === undefined) {
    this.position.set(Rob.integerInRange(20, game.width - 20), Rob.integerInRange(20, game.height - 20));
  } else {
    this.position.set(myParentArchon.position);
  }

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
  
  if(this.frameCount % 60 === 0) {
    this.flashDirection *= -1;
  }
  
  if(this.frameCount > 600) {
    this.flashDirection = 0;
  }
  
  if(this.flashDirection === -1) {
    this.sprite.tint = this.uniqueID === 0 ? 0x00FF00 : 0;
  } else if(this.flashDirection === 1) {
    this.sprite.tint = this.uniqueID === 0 ? 0x0000FF : 0xffffff;
  } else {
    this.sprite.tint = this.uniqueID === 0 ? 0x00FFFF : this.color;
  }

  this.sensor.x = this.sprite.x; // So the sensor will stay attached
  this.sensor.y = this.sprite.y; // So the sensor will stay attached
  
  this.accel.tick(this.frameCount);
  this.lizer.tick(this.frameCount);
  this.mover.tick(this.frameCount);
};

})(Rob);

if(typeof window === "undefined") {
  module.exports = Rob;
}
