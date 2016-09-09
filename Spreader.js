/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game, Phaser, Rob, theSun */

"use strict";

Rob.Spreader = function() {
  theSpreader = this; // jshint ignore: line
  this.yAxisRange = Rob.Range(game.height, 0);
  this.darknessRange = Rob.globals.darknessRange;
  this.stopped = false;

  // Phaser gives us mouseUp constantly. I want to ignore all
  // of these unless we've actually registered a mouseDown
  this.mouseUp = true;

  var _this = this;
  Rob.getTemperature = function(x, y) { return _this.getTemperature.call(_this, x, y); };
};

Rob.Spreader.prototype.avoid = function(me, him) {
  me.archon.mover.avoid(him);
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
  return Rob.Range(lumaBR, lumaTL);
};

Rob.Spreader.prototype.create = function() {
  game.physics.startSystem(Phaser.Physics.ARCADE);

  Rob.setupBitmaps();

  this.archons = new Rob.Archons();
  for(var i = 0; i < Rob.globals.archonCount; i++) {
    this.archons.breed();
  }

  this.motionVector = Rob.XY();

  this.sun = new Rob.Sun();

  this.mannaGarden = new Rob.MannaGarden(300, 3, this.db);

  this.frameCount = 0;

  this.worldColorRange = this.getWorldColorRange();

  this.cursors = game.input.keyboard.createCursorKeys();

  game.input.onUp.add(this.onMouseUp, this);
  game.input.onDown.add(this.onMouseDown, this);
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

  var lumaComponent = Rob.globals.temperatureRange.convertPoint(rgb.l, this.worldColorRange);

  var darkness = theSun.darkness.alpha;
  var darknessComponent = Rob.globals.temperatureRange.convertPoint(darkness, this.darknessRange);

  var yAxisComponent = Rob.globals.temperatureRange.convertPoint(y, this.yAxisRange);

  // Give luma and sun most of the weight. The y-axis thing is there
  // just to help them not get stuck in the luma dead zone(s)
  var final = (yAxisComponent + 10 * (lumaComponent + darknessComponent)) / 21;

  return final;
};

Rob.Spreader.prototype.handleClick = function(pointer) {
  var changeState = false;

  if(this.stopped) {
    // We're completely stopped; if it was a click in the open,
    // start everyone back up again. If it was a click on a
    // sprite, just allow the sprite to be dragged around,
    // don't start the world again
    var clickedOnASprite = false;
    this.archons.archonPool.forEachAlive(function(a) {
      if(clickedOnASprite) { return; }

      var radius = a.width / 2;
      var rect = new Phaser.Rectangle(
        a.x - radius, a.y - radius, a.width, a.height
      );

      if(Phaser.Rectangle.containsPoint(rect, pointer)) {
        clickedOnASprite = true;
      }
    }, this);

    // Clicked out in the open; start the world up again
    if(!clickedOnASprite) { this.stopped = false; changeState = true; }
  } else {
    // We're running normally; a click anywhere stops everyone
    this.stopped = true;
    changeState = true;
  }

  if(changeState) {
    this.archons.archonPool.forEachAlive(function(a) {
      a.archon.stopped = this.stopped;
    }, this);
  }
};

Rob.Spreader.prototype.onMouseDown = function(/*pointer*/) {
  this.mouseUp = false;
};

Rob.Spreader.prototype.onMouseUp = function(pointer) {
  if(!this.mouseUp) { this.mouseUp = true; this.handleClick(pointer); }
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

  if(this.cursors.up.isDown) { game.camera.y -= 4; }
  else if(this.cursors.down.isDown) { game.camera.y += 4; }
  else if(this.cursors.left.isDown) { game.camera.x -= 4; }
  else if(this.cursors.right.isDown) { game.camera.x += 4; }

  // Pass him the sensor for now; eventually, the mover will own
  // the sprite and the sensor
  game.physics.arcade.overlap(this.archons.sensorPool, this.mannaGarden.smellGroup, this.smell, null, this);
  game.physics.arcade.overlap(this.archons.sensorPool, this.mannaGarden.foodGroup, this.taste, null, this);
  game.physics.arcade.overlap(this.archons.archonPool, this.mannaGarden.foodGroup, this.eat, null, this);
  game.physics.arcade.overlap(this.archons.sensorPool, this.archons.archonPool, this.avoid, null, this);
  //game.physics.arcade.collide(this.archons.archonPool, this.archons.wallsGroup);

  this.frameCount++;
  this.mannaGarden.update(theSun.getStrength());
  this.archons.update();
};
