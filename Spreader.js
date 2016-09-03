Rob.Spreader = function() {
};

Rob.Spreader.prototype.create = function() {
  this.bg = new Rob.Bitmap('rectGradient');
  this.db = new Rob.Bitmap('debugBackground');

  var mannaCount = 200;
  var smellPerManna = 10;

  this.foodGroup = game.add.group();
  this.foodGroup.enableBody = true;
  this.foodGroup.createMultiple(mannaCount, 'alien', 0, false);

  this.smellGroup = game.add.group();
  this.smellGroup.enableBody = true;
  this.smellGroup.createMultiple(mannaCount * smellPerManna, 'food', 0, false);

  var smellConfig = {
    particleSource: null,   // Set per morsel
    interval: 1,            // Emit one particle per frame
    lifetime: 60,           // lifetime one sec
    size: Rob.XY(0, 0),
    distribution: null,     // Means random
    parent: null,            // Set per morsel
    minVelocity: Rob.XY(-50, -100),
    maxVelocity: Rob.XY(50, 100),
    visible: false
  };

  this.foodGroup.forEach(function(m) {
    m.anchor.setTo(0.5, 0.5);
    m.scale.setTo(0.2, 0.2);
    m.body.bounce.setTo(1, 1);
    m.body.collideWorldBounds = true;

    m.smellGroup = game.add.group();
    for(var i = 0; i < smellPerManna; i++) {
      var smellParticle = this.smellGroup.getChildAt(0);

      smellParticle.anchor.setTo(0.5, 0.5);
      smellParticle.scale.setTo(0.02, 0.02);
      smellParticle.body.bounce.setTo(1, 1);
      smellParticle.body.collideWorldBounds = true;

      m.smellGroup.addChild(smellParticle);
      this.smellGroup.removeChild(0);
    }

    smellConfig.particleSource = m.smellGroup;
    smellConfig.parent = m;
    m.smellEmitter = new Rob.Emitter(smellConfig);
  }, this);

  var mannaConfig = {
    particleSource: this.foodGroup,
    interval: 1,            // Emit one particle per frame
    lifetime: 5 * 60,       // lifetime in seconds
    size: Rob.XY(600, 200),
    position: Rob.XY(game.width / 2, game.height / 2),
    distribution: null      // Means random
  };

  this.emitters = [];

  var mannaEmitter = new Rob.Emitter(mannaConfig);
  this.emitters.push(mannaEmitter);
  mannaEmitter.start();

  return;

  for(j = 0; j < this.foodGroup.length; j++) {
    var a = this.foodGroup.getChildAt(j);
    a.anchor.setTo(0.5, 0.5);
    a.scale.setTo(0.2, 0.2);
    a.body.bounce.setTo(1, 1);
    a.body.collideWorldBounds = true;
    var x = game.rnd.integerInRange(0, game.width);
    //var y = game.rnd.integerInRange(0, game.height);
    var y = game.rnd.integerInRange(game.height / 2 - 200, game.height / 2 + 200)
    a.x = x; a.y = y;

    a.frameCount = game.rnd.integerInRange(0, 300);
    a.frameStamp = 0;

    a.smellIndex = 0;
    a.smell = game.add.group();

    for(var i = 0; i < foodCount / mannaCount; i++) {
      var s = this.smellGroup.getChildAt(0);

      s.frameCount = 0;
      s.new = true;

      a.smell.addChild(s);
      this.smellGroup.removeChild(0);
    }

    a.revive();
  };

  //this.emitters = [];

  //this.createEmitter();

  /*this.alien = game.add.sprite(game.width / 2, game.height / 2, 'alien');
  this.alien.anchor.set(0.5, 0.5);
  this.alien.inputEnabled = true;
  this.alien.input.enableDrag();
  game.physics.arcade.enable(this.alien);
  this.alien.body.collideWorldBounds = true;
  this.alien.body.bounce.setTo(1, 1);

  	var x = game.rnd.integerInRange(0, game.width);
  	var y = game.rnd.integerInRange(0, game.height);
  	game.physics.arcade.moveToXY(this.alien, x, y, 100);*/
};

Rob.Spreader.prototype.createEmitter = function() {
  for(var i = 0; i < 1; i++) {
    var particleCount = 200;
    var x = game.width / 2;
    var y = game.height / 2;

    var e = game.add.emitter(x, y, particleCount);

    e.width = game.width;
    e.height = 0;

    var key = 'alien';
    var frame = 0;
    var enableCollisions = true;
    e.makeParticles(key, frame, particleCount, enableCollisions);
    //e.add(this.smellGroup);

    e.maxParticleSpeed.set(0, 0);
    e.minParticleSpeed.set(0, 0);
    e.maxParticleScale = 0.25;
    e.minParticleScale = 0.25;
    e.maxRotation = 0;
    e.minRotation = 0;

    e.gravity = 0;

    var explode = false;
    var msBetweenManna = 250;
    var lifetime = 5000;
    e.start(explode, lifetime, msBetweenManna, 0);

    e.makessmell = true;
    this.emitters.push(e);
  }
};

Rob.Spreader.prototype.debugText = function() {
  this.db.text(
      0, 0,
      "P to 0: (" + this.alien.x.toFixed(0) + ", " + this.alien.y.toFixed() + ") " +
      "Angle to 0: " + Math.atan2(this.alien.y, this.alien.x).toFixed(4) + "\n" +
      "P to center: (" + relX.toFixed(0) + ", " + relY.toFixed(0) + ") " +
      "Angle to center: " + relTheta.toFixed(4) + "\n" +
      "x/y from A to C: (" + relCos.toFixed(4) + ", " + relSin.toFixed(4) + ")"
    );
};

Rob.Spreader.prototype.init = function() {
};

Rob.Spreader.prototype.preload = function() {
  game.load.image('alien', 'assets/sprites/ufo.png');
  game.load.image('rain', 'assets/sprites/rain.png');
  game.load.image('food', 'assets/sprites/pangball.png');
};

Rob.Spreader.prototype.update = function() {
  for(var i = 0; i < this.emitters.length; i++) {
    this.emitters[i].update();
  }
  return;

  this.foodGroup.forEach(function(a) {
    a.frameCount++;
    if(a.smellIndex < a.smell.length) {
      if(a.frameCount % 60 === 0) {
        var s = a.smell.getChildAt(a.smellIndex);

        if(s.new) {
          s.anchor.setTo(0.5, 0.5);
          s.scale.setTo(0.05, 0.05);
          s.body.bounce.setTo(1, 1);
          s.body.collideWorldBounds = true;
          s.angularVelocity = 0;
          s.x = a.x; s.y = a.y;

          var vx = game.rnd.integerInRange(-30, 30);
          var vy = game.rnd.integerInRange(0, 1) || -1;
          s.body.velocity.setTo(vx, vy * 75);
          s.revive();
          s.new = false;
          a.smellIndex++;
        }
      }
    } else {
      for(var i = 0; i < a.smell.length; i++) {
        var s = a.smell.getChildAt(a.smellIndex);
        if(s.alive) {
          s.frameCount++;
          if(s.frameCount >= 60) {
            s.kill();
          }
        }
      }
    }
  });
};

Phaser.Particle.prototype.onEmit = function() {
  return;
  if(this.parent.makessmell === undefined) {
    // If my parent doesn't make smell, then he is smell,
    // which means I'm his smell. Set my smell diffusing
    var x = game.rnd.integerInRange(-100, 100);
    var y = game.rnd.integerInRange(0, 1) || -1;
    this.body.velocity.setTo(x, y * 150);
  } else {
    // If my parent makes smell, then I'm smell. Appear
    // in a random spot, make sure I have a smell
    // emitter, and start fooding up the place
    var y = game.rnd.integerInRange(-100, 100);
    this.y = y + game.height / 2;

    if(this.emitter === undefined) {
      var particleCount = 50;

      var e = game.add.emitter(0, 0, particleCount);

      e.width = 0;
      e.height = 0;

      var key = 'food';
      var frame = 0;
      var enableCollisions = true;
      e.makeParticles(key, frame, particleCount, enableCollisions);
      //e.add(this.foodGroup);

      e.maxParticleScale = 0.25;
      e.minParticleScale = 0.25;

      e.gravity = 0;

      this.emitter = e;
      this.addChild(this.emitter);
      this.events.onKilled.add(function(){
        this.emitter.kill();
      }, this);
    }

    var explode = false;
    var msBetweenManna = 250;
    var lifetime = 2000;
    this.emitter.start(explode, lifetime, msBetweenManna, 0);
  }
};
