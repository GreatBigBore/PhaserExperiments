/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game, Phaser, Rob */

"use strict";

Rob.Spreader = function() {
  this.yAxisRange = new Rob.Range(game.height, 0);
  this.darknessRange = Rob.globals.darknessRange;
  this.stopped = false;

  // Phaser gives us mouseUp constantly. I want to ignore all
  // of these unless we've actually registered a mouseDown
  this.mouseUp = true;

  var _this = this;
  Rob.getTemperature = function(x, y) { return _this.getTemperature.call(_this, x, y); };
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
  return new Rob.Range(lumaBR, lumaTL);
};

Rob.Spreader.prototype.create = function() {
  game.physics.startSystem(Phaser.Physics.ARCADE);

  Rob.setupBitmaps();

  this.frameCount = 0;
  this.tideX = Rob.integerInRange(0, 1) || -1;
  this.tideY = Rob.integerInRange(0, 1) || -1;

  Rob.globals.archonia.spreader = this;

  Rob.globals.archonia.sun = new Rob.Sun();

  Rob.globals.archonia.mannaGarden = new Rob.MannaGarden(300, 3, this.db);
  
  Rob.globals.archonia.genomer = new Rob.Genomer();
  
  Rob.globals.archonia.familyTree = new Rob.FamilyTree();

  Rob.globals.archonia.archons = new Rob.Archons();

  this.sun = Rob.globals.archonia.sun;
  this.mannaGarden = Rob.globals.archonia.mannaGarden;
  this.archons = Rob.globals.archonia.archons;

  this.worldColorRange = this.getWorldColorRange();

  this.cursors = game.input.keyboard.createCursorKeys();
  game.input.onUp.add(this.onMouseUp, this);
  game.input.onDown.add(this.onMouseDown, this);
};

Rob.Spreader.prototype.debugText = function(text) {
  Rob.db.text(0, 0, text);
};

Rob.Spreader.prototype.eat = function(sprite, foodParticle) {
  sprite.archon.lizer.eat(foodParticle);
};

Rob.Spreader.prototype.ffAction = function(lhs, rhs) {
  if(lhs.archon.uniqueID !== rhs.archon.uniqueID) {
    lhs.archon.lizer.ffAction(rhs);
  }
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

  var darkness = Rob.globals.archonia.theSun.darkness.alpha;
  var darknessComponent = Rob.globals.temperatureRange.convertPoint(darkness, this.darknessRange);

  var yAxisComponent = Rob.globals.temperatureRange.convertPoint(y, this.yAxisRange);

  // Give luma and sun most of the weight. The y-axis thing is there
  // just to help them not get stuck in the luma dead zone(s)
  var final = (yAxisComponent + 10 * (lumaComponent + darknessComponent)) / 21;

  return final;
};

Rob.Spreader.prototype.handleClick = function(pointer) {
  var clickedOnASprite = false;
  var whichSprite = null;
  this.archons.phaseronPool.forEachAlive(function(a) {
    if(clickedOnASprite) { return; }

    var radius = a.width / 2;
    var rect = new Phaser.Rectangle(
      a.x - radius, a.y - radius, a.width, a.height
    );

    if(Phaser.Rectangle.containsPoint(rect, pointer)) {
      clickedOnASprite = true;
      whichSprite = a;
    }
  }, this);

  if(clickedOnASprite) {
    this.report(whichSprite);
  } else if(pointer.x < 50 && pointer.y > 550) {  // Left-corner click to dismiss the histogram
    Rob.pg.show(false);
  } else if(!Rob.pointInBounds(pointer)) {
    Rob.globals.archonia.archons.geneReport();    // Any other click near the edges advances through the genes
  } else {
    game.paused = !game.paused;                   // Click out in the open pauses/resumes
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

Rob.Spreader.prototype.report = function(whichSprite) {
  var a = whichSprite.archon;

  console.log(
    "\n\nReport for archon " + a.uniqueID +
    ": mass = " + a.lizer.getMass().toFixed(4) +
    ", age " + Rob.numberFix(whichSprite.archon.frameCount / 60, 2) + " seconds"
  );
  
  console.log("\nMetabolism");
  
  var showStats = function(whichSet) {
    console.log(
      Rob.rPad(whichSet + ": calories in", 28, '.') +
      Rob.lPad(Rob.numberFix(whichSprite.archon.lizer.stats[whichSet].caloriesIn, 2), 10) +
      Rob.rPad(', calories out', 27, '.') +
      Rob.lPad(Rob.numberFix(whichSprite.archon.lizer.stats[whichSet].caloriesOut, 2), 9)
    );
  };

  showStats('thisSecond');
  showStats('thisLifetime');
  
  console.log("\nCalories in:");
  
  var gainLossMessage = whichSprite.archon.parasite ? ", gained from parasitism" : ", lost to parasites";
  console.log(
    Rob.rPad("Calories from grazing", 28, '.') +
    Rob.lPad(Rob.numberFix(whichSprite.archon.lizer.stats.thisLifetime.grazing, 2), 10) +
    Rob.rPad(gainLossMessage, 27, '.') +
    Rob.lPad(Rob.numberFix(whichSprite.archon.lizer.stats.thisLifetime.parasitism, 2), 9)
  );
  
  console.log("\nCalories out:");

  console.log(
    Rob.rPad("Sensor", 28, '.') +
    Rob.lPad(Rob.numberFix(whichSprite.archon.lizer.stats.thisLifetime.costBreakdown.sensor, 2), 10)
  );
  
  console.log(
    Rob.rPad("Temp in range", 28, '.') +
    Rob.lPad(Rob.numberFix(whichSprite.archon.lizer.stats.thisLifetime.costBreakdown.tempInRange, 2), 10) +
    Rob.rPad(", out of range", 15, '.') +
    Rob.lPad(Rob.numberFix(whichSprite.archon.lizer.stats.thisLifetime.costBreakdown.tempOutOfRange, 2), 9) +
    Rob.rPad(", total", 15, '.') +
    Rob.lPad(Rob.numberFix(whichSprite.archon.lizer.stats.thisLifetime.costBreakdown.totalTemp, 2), 9)
  );
  
  console.log(
    Rob.rPad("Friction", 28, '.') +
    Rob.lPad(Rob.numberFix(whichSprite.archon.lizer.stats.thisLifetime.costBreakdown.friction, 2), 10) +
    Rob.rPad(", inertia", 15, '.') +
    Rob.lPad(Rob.numberFix(whichSprite.archon.lizer.stats.thisLifetime.costBreakdown.inertia, 2), 9) +
    Rob.rPad(", total motion", 15, '.') +
    Rob.lPad(Rob.numberFix(whichSprite.archon.lizer.stats.thisLifetime.costBreakdown.totalMotion, 2), 9)
  );

  console.log("\nGenome:");
  
  for(var i in Rob.globals.archonia.genomer.primordialGenome) {
    if(i !== 'color') {
      var value = whichSprite.archon[i];

      console.log(Rob.rPad(i, 28, '.'), Rob.lPad(Rob.numberFix(value, 2), 9));
    }
  }
};


Rob.Spreader.prototype.taste = function(sprite, tastyParticle) {
  sprite.archon.locator.taste(tastyParticle);
};

Rob.Spreader.prototype.ffSense = function(lhs, rhs) {
  lhs.archon.locator.ffSense(rhs);
};

Rob.Spreader.prototype.update = function() {
  Rob.db.bm.cls();

  if(this.cursors.up.isDown) { game.camera.y -= 4; }
  else if(this.cursors.down.isDown) { game.camera.y += 4; }
  else if(this.cursors.left.isDown) { game.camera.x -= 4; }
  else if(this.cursors.right.isDown) { game.camera.x += 4; }

  // Pass him the sensor for now; eventually, the mover will own
  // the sprite and the sensor
  game.physics.arcade.overlap(this.archons.sensorPool, this.mannaGarden.foodGroup, this.taste, null, this);
  game.physics.arcade.overlap(this.archons.phaseronPool, this.mannaGarden.foodGroup, this.eat, null, this);

  game.physics.arcade.overlap(this.archons.sensorPool, this.archons.phaseronPool, this.ffSense, null, this);
  game.physics.arcade.overlap(this.archons.phaseronPool, this.archons.phaseronPool, this.ffAction, null, this);

  this.frameCount++;
  
  this.mannaGarden.tick(Rob.globals.archonia.theSun.getStrength());
  this.archons.tick();
};
