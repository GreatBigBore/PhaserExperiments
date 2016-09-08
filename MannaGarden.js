/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game, Phaser, Rob, theMannaGarden */

"use strict";

Rob.MannaGarden = function(mannaCount, smellPerMorsel, db) {
  this.db = db;
  this.mannaCount = (mannaCount === undefined) ? 300 : mannaCount;
  this.smellPerManna = (smellPerMorsel === undefined) ? 3: smellPerMorsel;

  this.emitters = [];

  this.frameCount = 0;

  var mannaConfig = {
    interval: 1,            // Emit one particle per frame
    lifetime: 5 * 60,       // lifetime in seconds
    size: Rob.XY(game.width, 150),
    position: Rob.XY(game.width / 2, game.height / 4),
    maxVelocity: Rob.XY(),
    minVelocity: Rob.XY(),
    parent: null,
    visible: true
  };

  this.setupMannaGenerator(mannaConfig, this.db);

  var smellConfig = {
    interval: 1,            // Emit one particle per frame
    lifetime: 2 * 60,           // lifetime in frames
    size: Rob.XY(0, 0),
    distribution: null,     // Means random
    parentGroup: this.foodGroup,
    minVelocity: Rob.XY(-50, -100),
    maxVelocity: Rob.XY(50, -10),
    visible: false
  };

  this.setupSmellGenerator(smellConfig);

  for(var i = 0; i < this.emitters.length; i++) {
    this.emitters[i].start();
  }
};

Rob.MannaGarden.prototype.render = function() {
  var showDebugOutlines = false;

  if(showDebugOutlines) {
    this.smellGroup.forEachAlive(function(s) {
      game.debug.body(s, 'yellow', false);
      game.debug.spriteBounds(s, 'black', false);
    });

    this.foodGroup.forEachAlive(function(s) {
      game.debug.body(s, 'yellow', false);
      game.debug.spriteBounds(s, 'black', false);
    });
  }
};

Rob.MannaGarden.prototype.setEfficiency = function(efficiency) {
  // Easier than using some arbitrary and complex math; just set
  // specific emission intervals for each step of efficiency. For
  // each increment of 10%, change the interval to a particular value
  efficiency = Math.ceil(efficiency * 10);

  var mannaEmitter = this.emitters[0];
  var smellEmitter = this.emitters[1];

  var lifetimeMap = [ 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0 ];
  mannaEmitter.config.lifetime = lifetimeMap[efficiency] * 60;

  var intervalMap = [ 60, 60, 40, 40, 10, 5, 3, 2, 1, 1, 1 ];
  smellEmitter.config.interval = intervalMap[efficiency];
  mannaEmitter.config.interval = intervalMap[efficiency];
};

Rob.MannaGarden.prototype.setPosition = function(sunStrength) {
  var mannaEmitter = this.emitters[0];

  var topOfMyRange = game.height / 2;
  var bottomOfMyRange = game.height - (this.emitters[0].config.size.y / 2);

  var myRangeSize = (bottomOfMyRange - topOfMyRange);
  var position = bottomOfMyRange - sunStrength * myRangeSize;

  mannaEmitter.config.position.y = position;
};

Rob.MannaGarden.prototype.setSunStrength = function(sunStrength) {
  sunStrength = Rob.clamp(sunStrength, 0, 1);

  this.setEfficiency(sunStrength);
  this.setPosition(sunStrength);
};

Rob.MannaGarden.prototype.setupMannaGenerator = function(mannaConfig) {
  this.foodGroup = game.add.group();
  this.foodGroup.enableBody = true;
  this.foodGroup.createMultiple(this.mannaCount, 'particles', 0, false);
  game.physics.enable(this.foodGroup, Phaser.Physics.ARCADE);

  this.foodGroup.forEach(function(m) {
    m.previousEmit = 0;
    m.birthday = 0;
    m.anchor.setTo(0.5, 0.5);
    m.scale.setTo(0.1, 0.1);
    m.body.setSize(m.width, m.height);
    m.body.bounce.setTo(0, 0);
    m.body.collideWorldBounds = true;

    m.smellArray = [];
  }, this);

  mannaConfig.particleSource = this.foodGroup;

  this.mannaGenerator = new Rob.MannaGenerator(mannaConfig, this.db);
  this.emitters.push(this.mannaGenerator);
};

Rob.MannaGarden.prototype.setupSmellGenerator = function(smellConfig) {
  this.smellGroup = game.add.group();
  this.smellGroup.enableBody = true;
  this.smellGroup.createMultiple(this.mannaCount * this.smellPerManna, 'particles', 0, false);
  game.physics.enable(this.smellGroup, Phaser.Physics.ARCADE);

  this.smellGroup.forEach(function(s) {
    s.previousEmit = 0;
    s.birthday = 0;
    s.anchor.setTo(0.5, 0.5);
    s.scale.setTo(0.3, 0.3);
    s.body.setSize(s.width, s.height);
    s.body.bounce.setTo(1, 1);
    game.physics.enable(s, Phaser.Physics.ARCADE);
  }, this);

  smellConfig.particleSource = this.smellGroup;

  this.smellGenerator = new Rob.MannaGenerator(smellConfig);
  this.emitters.push(this.smellGenerator);
};

Rob.MannaGarden.prototype.update = function(sunStrength) {
  this.setSunStrength(sunStrength);

  for(var i = 0; i < this.emitters.length; i++) {
    this.emitters[i].update();
  }
};
