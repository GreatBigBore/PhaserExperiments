/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game, Phaser, Rob, theSun */

"use strict";

Rob.Spreader = function() {
  theSpreader = this; // jshint ignore: line
  this.temperatureLo = -1000;
  this.temperatureHi = 1000;
  this.temperatureRange = Rob.Range(this.temperatureLo, this.temperatureHi);
  this.yAxisRange = Rob.Range(0, game.height);
};

Rob.Spreader.prototype.getWorldColorRange = function() {
  var rgb = {};

  Rob.bg.bm.getPixelRGB(game.width / 2, 10, rgb, true);
  var lumaTL = rgb.l;

  Rob.bg.bm.getPixelRGB(
    Math.floor(game.width / 2), Math.floor(game.height - 10), rgb, true
  );
  var lumaBR = rgb.l;

  // Bottom right is the cold end, top left is the hot
  return Rob.Range(lumaTL, lumaBR);
};

Rob.Spreader.prototype.create = function() {
  game.physics.startSystem(Phaser.Physics.ARCADE);

  Rob.setupBitmaps();

  this.archons = new Rob.Archons();
  for(var i = 0; i < 2; i++) {
    this.archons.breed();
  }

  this.motionVector = Rob.XY();

  this.sun = new Rob.Sun();

  this.brightnessRange = theSun.getBrightnessRange();

  this.mannaGarden = new Rob.MannaGarden(300, 3, this.db);

  this.frameCount = 0;

  this.worldColorRange = this.getWorldColorRange();
};

Rob.Spreader.prototype.debugText = function(text) {
  Rob.db.text(0, 0, text);
};

Rob.Spreader.prototype.eat = function(sprite, foodParticle) {
  sprite.archon.mover.eat(foodParticle);
  sprite.archon.lizer.eat(Rob.globals.caloriesPerMannaMorsel);
};

Rob.Spreader.prototype.getTemperature = function(x, y) {
  // Allow callers to specify an object with x/y rather than an x and a y
  if(x.x !== undefined) {
    y = x.y; x = x.x;
  }

  x = Math.floor(x); y = Math.floor(y);

  var rgb = {};
  Rob.bg.bm.getPixelRGB(x, y, rgb, true);

  var lumaComponent = this.temperatureRange.convertPoint(rgb.l, this.worldColorRange);
  var yAxisComponent = this.temperatureRange.convertPoint(game.height - y, this.yAxisRange);

  var sunStrength = theSun.getStrength() * this.brightnessRange.getSize();
  var sunComponent =
    this.temperatureRange.convertPoint(sunStrength, this.brightnessRange);

  // Give luma and sun most of the weight. The y-axis thing is there
  // just to help them not get stuck in the luma dead zone(s)
  var final = (yAxisComponent + 10 * (lumaComponent + sunComponent)) / 21;

  /*this.debugText(
    "Luma:  " + lumaComponent.toFixed(4) + ", " + rgb.l.toFixed(4) + "\n" +
    "Sun:   " + sunComponent.toFixed(4) + "\n" +
    "Y      " + yAxisComponent.toFixed(4) + "\n" +
    "Final: " + final.toFixed(2)
  );*/

  return final;
};

Rob.Spreader.prototype.preload = function() {
  game.load.image('alien', 'assets/sprites/ufo.png');
  game.load.image('particles', 'assets/sprites/pangball.png');
};

Rob.Spreader.prototype.render = function() {
  this.archons.render();
  this.mannaGarden.render();
};

Rob.Spreader.prototype.smell = function(sprite, smellyParticle) {
  sprite.archon.mover.smell(smellyParticle);
};

Rob.Spreader.prototype.taste = function(sprite, tastyParticle) {
  sprite.archon.mover.taste(tastyParticle);
};

Rob.Spreader.prototype.update = function() {
  Rob.db.bm.cls();

/*  var topOfScreen = 0;
  var topOfMyRange = topOfScreen + 100;

  var bottomOfScreen = game.height;
  var bottomOfMyRange = bottomOfScreen - 100;

  var fuck1 = (this.sprite.y - topOfMyRange);
  var fuck3 = (bottomOfMyRange - topOfMyRange);
  var efficiency = 1 - (fuck1 / fuck3);*/

  this.motionVector.reset();
  this.overlapCounter = 0;

  // Pass him the sensor for now; eventually, the mover will own
  // the sprite and the sensor
  game.physics.arcade.overlap(this.archons.sensorPool, this.mannaGarden.smellGroup, this.smell, null, this);
  game.physics.arcade.overlap(this.archons.sensorPool, this.mannaGarden.foodGroup, this.taste, null, this);
  game.physics.arcade.overlap(this.archons.archonPool, this.mannaGarden.foodGroup, this.eat, null, this);

  /*Rob.db.draw(
    this.sensor,
    this.motionVector.
      normalized().
      timesScalar(this.sensor.width).
      plus(this.sensor),
    'green', 1
  );*/

  this.frameCount++;
  this.mannaGarden.update(theSun.getStrength());
  this.archons.update();
};
