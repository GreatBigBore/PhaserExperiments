/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game, Phaser, Rob */

"use strict";

Rob.Spreader = function() {
};

Rob.Spreader.prototype.create = function() {
  game.physics.startSystem(Phaser.Physics.ARCADE);

  this.bg = new Rob.Bitmap('rectGradient');
  this.db = new Rob.Bitmap('debugBackground');
  this.rg = new Rob.Bitmap('realityGoo');

  this.motionVector = Rob.XY();

  this.makeArchon();

  this.mannaGarden = new Rob.MannaGarden(300, 3, this.db);
  this.sun = new Rob.Sun();

  this.frameCount = 0;
};

Rob.Spreader.prototype.debugText = function() {
  if(1) {
    this.db.text(0, 0, "hello world\n");
  }
};

Rob.Spreader.prototype.init = function() {
};

Rob.Spreader.prototype.makeArchon = function() {
  var center = Rob.XY(game.width / 2, game.height / 2);
  this.sensor = game.add.sprite(center.x, 100, game.cache.getBitmapData('realityGoo'));
  this.sprite = game.add.sprite(center.x, 100, game.cache.getBitmapData('realityGoo'));

  this.sensor.scale.setTo(1, 1);
  this.sprite.scale.setTo(0.5, 0.5);

  this.sensor.anchor.setTo(0.5, 0.5);
  this.sprite.anchor.setTo(0.5, 0.5);

  this.sensor.tint = 0xFF0000;
  this.sprite.tint = 0x0000FF;

  this.sensor.alpha = 0.5;
  this.sprite.alpha = 1;

  this.sprite.inputEnabled = true;
  this.sprite.input.enableDrag();

  var finalSetup = function(s) {
    game.physics.enable(s, Phaser.Physics.ARCADE);

    var radius = s.width / 2;
    s.body.setCircle(radius, 0, 0);
    s.body.syncBounds = true;
  };

  finalSetup(this.sensor);
  finalSetup(this.sprite);
};

Rob.Spreader.prototype.preload = function() {
  game.load.image('alien', 'assets/sprites/ufo.png');
  game.load.image('particles', 'assets/sprites/pangball.png');
};

Rob.Spreader.prototype.render = function() {
  this.sensor.x = this.sprite.x; this.sensor.y = this.sprite.y;
  this.showDebugOutlines = false;
  if(this.showDebugOutlines) {
    game.debug.body(this.sensor, 'blue', false);
    game.debug.body(this.sprite, 'yellow', false);

    game.debug.spriteBounds(this.sensor, 'magenta', false);
    game.debug.spriteBounds(this.sprite, 'black', false);

    this.smellGroup.forEach(function(a) {
      game.debug.body(a, 'blue', false);
      game.debug.spriteBounds(a, 'magenta', false);

    }, this);
  }
};

Rob.Spreader.prototype.smell = function(sensor, smellyParticle) {
  this.motionVector.add(Rob.XY(smellyParticle).minus(sensor));
  this.overlapCounter++;
};

Rob.Spreader.prototype.update = function() {
  this.db.bm.cls();

/*  var topOfScreen = 0;
  var topOfMyRange = topOfScreen + 100;

  var bottomOfScreen = game.height;
  var bottomOfMyRange = bottomOfScreen - 100;

  var fuck1 = (this.sprite.y - topOfMyRange);
  var fuck3 = (bottomOfMyRange - topOfMyRange);
  var efficiency = 1 - (fuck1 / fuck3);*/

  this.motionVector.reset();
  this.overlapCounter = 0;

  game.physics.arcade.overlap(this.sensor, this.mannaGarden.smellGroup, this.smell, null, this);

  this.db.draw(
    this.sensor,
    this.motionVector.
      normalized().
      timesScalar(this.sensor.width).
      plus(this.sensor),
    'green', 1
  );

  this.frameCount++;
  this.mannaGarden.update(this.sun.getStrength());
};
