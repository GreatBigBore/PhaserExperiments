Rob.Mover = function() {
};

Rob.Mover.prototype.create = function() {
  game.physics.startSystem(Phaser.Physics.ARCADE);

  this.bg = new Rob.Bitmap('rectGradient');
  this.db = new Rob.Bitmap('debugBackground');

  this.alien = game.add.sprite(game.width / 2, game.height / 2, 'alien');
  this.alien.anchor.set(0.5, 0.5);
  this.alien.inputEnabled = true;
  this.alien.input.enableDrag();
  game.physics.arcade.enable(this.alien);

  this.sensor = game.add.sprite(0, 0, 'sensor');
  this.sensor.anchor.set(0.5, 0.5);
  /*this.sensor.inputEnabled = true;
  this.sensor.input.enableDrag();*/
  game.physics.arcade.enable(this.sensor);

  this.sensor.scale.setTo(0.2, 0.2);
  this.sensor.body.setCircle(16)
  this.sensor.body.syncBounds = true;
  this.sensor.alpha = 0.1;
  this.alien.addChild(this.sensor);

  this.clowns = game.add.group()

  this.motioner = new Motioner(this.db, this.alien, 120);
};

Rob.Mover.prototype.dragStart = function(clown) {
  clown.dragging = true;
};

Rob.Mover.prototype.dragStop = function(clown) {
  clown.dragging = false;
};

Rob.Mover.prototype.init = function() {
  game.input.onTap.add(this.tap, this);
};

Rob.Mover.prototype.killClown = function(clown) {
  if(!clown.dragging) {
    clown.kill();
  }
};

function Motioner(debugBitmap, sprite, maxSpeed) {
  this.frameCount = 0;
  this.maneuverStamp = 0;
  this.maneuverComplete = true;
  this.needUpdate = false;
  this.damper = 10;
  this.db = debugBitmap;

  this.sprite = sprite;
  this.body = sprite.body;

  this.maxSpeed = maxSpeed;
  this.maxAcceleration = maxSpeed / 4;

  this.currentTargetX = this.sprite.x;
  this.currentTargetY = this.sprite.y;

  game.physics.arcade.moveToXY(this.sprite, game.rnd.integerInRange(0, game.width),
    game.rnd.integerInRange(0, game.height), 30);
};

Motioner.prototype.setTarget = function(hisX, hisY) {
  this.hisX = hisX;
  this.hisY = hisY;

  this.maneuverComplete = false;
  this.setNewVelocity();
};

Motioner.prototype.setNewVelocity = function() {
  this.maneuverStamp = this.frameCount;

  // Get his into the same frame of reference as the velocity vector
  var relX = this.hisX - this.sprite.x;
  var relY = this.hisY - this.sprite.y;

  var vX = this.body.velocity.x;
  var vY = this.body.velocity.y;

  // Get the angle between my velocity vector and
  // the distance vector from me to him.

  var deltaD = Math.sqrt(Math.pow(vX + relX, 2) + Math.pow(vY + relY, 2));
  var thetaToTarget = Math.atan2(vY + relY, vX + relX);

  var bestVx = Math.cos(thetaToTarget) * deltaD;
  var bestVy = Math.sin(thetaToTarget) * deltaD;

  this.needUpdate = (deltaD > this.maxSpeed);
  deltaD = Math.min(deltaD, this.maxSpeed);

  var vCurtailedX = Math.cos(thetaToTarget) * deltaD;
  var vCurtailedY = Math.sin(thetaToTarget) * deltaD;

  // Now we need to know how much change we intend to apply
  // to the current velocity vectors, so we can scale that
  // change back to limit the acceleration.
  var bestDeltaX = vCurtailedX - vX;
  var bestDeltaY = vCurtailedY - vY;

  var deltaV = Math.sqrt(Math.pow(bestDeltaX, 2) + Math.pow(bestDeltaY, 2));

  // These two are just so I can show debug info
  var aCurtailedX = vCurtailedX;
  var aCurtailedY = vCurtailedY;

  if(deltaV > this.maxAcceleration) {
    this.needUpdate = true;

    bestDeltaX *= this.maxAcceleration / deltaV;
    bestDeltaY *= this.maxAcceleration / deltaV;

    aCurtailedX = bestDeltaX + this.body.velocity.x;
    aCurtailedY = bestDeltaY + this.body.velocity.y;
  }

  var finalX = bestDeltaX + this.body.velocity.x;
  var finalY = bestDeltaY + this.body.velocity.y;

  this.body.velocity.setTo(finalX, finalY);

  this.db.text(
    0, 0,
    "Ship to mouse: (" + relX.toFixed(0) + ", " + relY.toFixed(0) + ")\n" +
    "Max change: (" + bestVx.toFixed(4) + ", " + bestVy.toFixed(4) + ")\n" +
    "Cut vchange: (" + vCurtailedX.toFixed(4) + ", " + vCurtailedY.toFixed(4) + ")\n" +
    "Cut achange: (" + aCurtailedX.toFixed(4) + ", " + aCurtailedY.toFixed(4) + ")\n"
  );
};

Motioner.prototype.tick = function() {
  this.frameCount++;

  if(
    !this.maneuverComplete && this.needUpdate &&
    this.frameCount > this.maneuverStamp + this.damper) {
    this.setNewVelocity();
  }
};

Rob.Mover.prototype.move = function() {

};

Rob.Mover.prototype.preload = function() {
  game.load.image('alien', 'assets/sprites/ufo.png');
  game.load.image('clown', 'assets/sprites/clown.png');
  game.load.image('sensor', 'assets/skies/deepblue.png');
};

Rob.Mover.prototype.tap = function(pointer, doubleTap) {
  this.motioner.setTarget(pointer.x, pointer.y);
  return;

  var killedAClown = false;

  this.clowns.forEach(function(c) {
    if(c.getBounds().contains(pointer.x, pointer.y)) {
      killedAClown = true;
      c.kill();
      return false;
    }
  }, this);

  if(!killedAClown) {
    var clown = game.add.sprite(pointer.x, pointer.y, 'clown');
    clown.anchor.set(0.5, 0.5);
    clown.inputEnabled = true;
    clown.input.enableDrag();
    clown.events.onInputUp.add(this.killClown, this);
    clown.events.onDragStop.add(this.dragStop, this);
    clown.events.onDragStart.add(this.dragStart, this);

    clown.dragging = false;

    this.clowns.add(clown);
  }
};

Rob.Mover.prototype.update = function() {
  this.motioner.tick();
  //game.physics.arcade.moveToPointer(this.alien);
};
