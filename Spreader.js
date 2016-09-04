Rob.Spreader = function() {
};

Rob.Spreader.prototype.create = function() {
  game.physics.startSystem(Phaser.Physics.ARCADE);

  this.bg = new Rob.Bitmap('rectGradient');
  this.db = new Rob.Bitmap('debugBackground');
  this.rg = new Rob.Bitmap('realityGoo');

  this.motionVector = Rob.XY();

  this.mannaCount = 300;
  this.smellPerManna = 3;

  this.emitters = [];

  this.makeArchon();
  this.setupMannaGenerator();
  this.setupSmellGenerator();

  this.frameCount = 0;
};

Rob.Spreader.prototype.debugText = function() {
  if(1)
  this.db.text(
      0, 0,
      "hello world\n"
    );
};

Rob.Spreader.prototype.init = function() {
};

Rob.Spreader.prototype.makeArchon = function() {
  var center = Rob.XY(game.width / 2, game.height / 2);
  this.sensor = game.add.sprite(center.x, center.y, game.cache.getBitmapData('realityGoo'));
  this.sprite = game.add.sprite(center.x, center.y, game.cache.getBitmapData('realityGoo'));

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

Rob.Spreader.prototype.setupMannaGenerator = function() {
  this.foodGroup = game.add.group();
  this.foodGroup.enableBody = true;
  this.foodGroup.createMultiple(this.mannaCount, 'particles', 0, false);
  game.physics.enable(this.foodGroup, Phaser.Physics.ARCADE);

  this.foodGroup.forEach(function(m) {
    m.previousEmit = 0;
    m.birthday = 0;
    m.anchor.setTo(0.5, 0.5);
    m.scale.setTo(0.1, 0.1);
    m.body.bounce.setTo(0, 0);
    m.body.collideWorldBounds = true;

    m.smellArray = [];
  }, this);

  var mannaConfig = {
    particleSource: this.foodGroup,
    interval: 1,            // Emit one particle per frame
    lifetime: 5 * 60,       // lifetime in seconds
    size: Rob.XY(game.width, 200),
    position: Rob.XY(game.width / 2, game.height / 2),
    distribution: null,      // Null means random
    parent: null
  };

  this.mannaGenerator = new Rob.MannaGenerator(mannaConfig);
  this.emitters.push(this.mannaGenerator);
  this.mannaGenerator.start();
};

Rob.Spreader.prototype.setupSmellGenerator = function() {
  this.smellGroup = game.add.group();
  this.smellGroup.enableBody = true;
  this.smellGroup.createMultiple(this.mannaCount * this.smellPerManna, 'particles', 0, false);
  game.physics.enable(this.smellGroup, Phaser.Physics.ARCADE);

  var smellConfig = {
    particleSource: this.smellGroup,
    interval: 1,            // Emit one particle per frame
    lifetime: 2 * 60,           // lifetime in frames
    size: Rob.XY(0, 0),
    distribution: null,     // Means random
    parentGroup: this.foodGroup,
    minVelocity: Rob.XY(-50, -100),
    maxVelocity: Rob.XY(50, 100),
    visible: false
  };

  this.smellGroup.forEach(function(s) {
    s.previousEmit = 0;
    s.birthday = 0;
    s.anchor.setTo(0.5, 0.5);
    s.scale.setTo(0.3, 0.3);
    s.body.bounce.setTo(1, 1);
    //s.body.collideWorldBounds = true;
    game.physics.enable(s, Phaser.Physics.ARCADE);
  }, this);

  this.smellGenerator = new Rob.MannaGenerator(smellConfig);
  this.emitters.push(this.smellGenerator);
  this.smellGenerator.start();
};

Rob.Spreader.prototype.smell = function(sensor, smellyParticle) {
  this.motionVector.add(Rob.XY(smellyParticle).minus(sensor));
  this.overlapCounter++;
};

Rob.Spreader.prototype.update = function() {
  this.db.bm.cls();

  this.motionVector.reset();
  this.overlapCounter = 0;
  game.physics.arcade.overlap(this.sensor, this.smellGroup, this.smell, null, this);

  this.db.draw(
    this.sensor,
    this.motionVector.
      normalized().
      timesScalar(this.sensor.width).
      plus(this.sensor),
    'green', 1
  );

  for(var i = 0; i < this.emitters.length; i++) {
    this.emitters[i].update();
  }
};
