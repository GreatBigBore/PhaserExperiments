/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game, Phaser, Rob */

"use strict";

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
  this.sensor.body.setCircle(16);
  this.sensor.body.syncBounds = true;
  this.sensor.alpha = 0.1;
  this.alien.addChild(this.sensor);

  this.clowns = game.add.group();

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
}

Motioner.prototype.setTarget = function(him) {
  this.him = Rob.XY(him);

  this.maneuverComplete = false;
  this.setNewVelocity();
};

Motioner.prototype.setNewVelocity = function() {
  this.maneuverStamp = this.frameCount;

  // Get his into the same frame of reference as the velocity vector
  var rel = Rob.XY(this.him).minus(this.sprite);
  var v = Rob.XY(this.body.velocity);

  // Get the angle between my velocity vector and
  // the distance vector from me to him.

  var deltaD = v.plus(rel).getMagnitude();
  var thetaToTarget = v.plus(rel).getAngle();

  var bestV = Rob.XY().makeFromAngle(thetaToTarget, deltaD);

  this.needUpdate = (deltaD > this.maxSpeed);
  deltaD = Math.min(deltaD, this.maxSpeed);

  var vCurtailed = Rob.XY().makeFromAngle(thetaToTarget, deltaD);

  // Now we need to know how much change we intend to apply
  // to the current velocity vectors, so we can scale that
  // change back to limit the acceleration.
  var bestDelta = Rob.XY(vCurtailed).minus(v);

  var deltaV = bestDelta.getMagnitude();

  // This is just so I can show debug info
  var aCurtailed = Rob.XY(vCurtailed);

  if(deltaV > this.maxAcceleration) {
    this.needUpdate = true;

    bestDelta.scalarMultiply(this.maxAcceleration / deltaV);

    // Just for showing debug info
    aCurtailed = bestDelta.plus(this.body.velocity);
  }

  var final = bestDelta.plus(this.body.velocity);

  this.body.velocity.setTo(final.x, final.y);

  this.db.text(
    0, 0,
    "Ship to mouse: (" + rel.X() + ", " + rel.Y() + ")\n" +
    "Max change: (" + bestV.X(4) + ", " + bestV.Y(4) + ")\n" +
    "Cut vchange: (" + vCurtailed.X(4) + ", " + vCurtailed.Y(4) + ")\n" +
    "Cut achange: (" + aCurtailed.X(4) + ", " + aCurtailed.Y(4) + ")\n"
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

Rob.Mover.prototype.tap = function(pointer/*, doubleTap*/) {
  this.motioner.setTarget(pointer);
  return;

  /*var killedAClown = false;

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
  }*/
};

Rob.Mover.prototype.update = function() {
  this.motioner.tick();
  //game.physics.arcade.moveToPointer(this.alien);
};
