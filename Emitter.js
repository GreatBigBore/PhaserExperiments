Rob.Emitter = function(config) {
  Object.assign(this, config);

  this.on = false;
  this.frameCount = 0;
  this.previousEmit = this.frameCount;

  if(this.particleSource === undefined) { throw "Rob.Emitter needs a source of particles"; }
  if(this.interval === undefined) { this.interval = 60; }
  if(this.lifetime === undefined) { this.lifetime = 60; }
  if(this.visible === undefined) { this.visible = true; }
  if(this.size === undefined) { this.size = Rob.XY(); } else { this.size = Rob.XY(config.size); }
  if(this.position === undefined) { this.position = Rob.XY(); }
    else { this.position = Rob.XY(config.position); }

  if(this.minVelocity === undefined) { this.minVelocity = Rob.XY(); }
    else { this.minVelocity = Rob.XY(config.minVelocity); }

  if(this.maxVelocity === undefined) { this.maxVelocity = Rob.XY(); }
    else { this.maxVelocity = Rob.XY(config.maxVelocity); }
};

Rob.Emitter.prototype.emit = function() {
  var p = this.particleSource.getFirstDead();
  if(p !== null) {
    if(this.distribution === null) {
      var x = game.rnd.integerInRange(this.position.x - this.size.x / 2, this.position.x + this.size.x / 2);
      var y = game.rnd.integerInRange(this.position.y - this.size.y / 2, this.position.y + this.size.y / 2);
    } else {
      this.distribution.call(p);
    }

    if(this.parent !== undefined) {
      x += this.parent.x; y += this.parent.y;
    }

    p.x = x; p.y = y;

    p.body.velocity.x = game.rnd.integerInRange(this.minVelocity.x, this.maxVelocity.x);
    p.body.velocity.y = game.rnd.integerInRange(this.minVelocity.y, this.maxVelocity.y);

    p.revive();
    p.visible = this.visible;

    if(p.smellEmitter !== undefined) {
      p.smellEmitter.start();
    }

    p.birthStamp = this.frameCount;

    this.previousEmit = this.frameCount;
  }
};

Rob.Emitter.prototype.start = function() {
  this.on = true;
};

Rob.Emitter.prototype.stop = function() {
  this.on = false;

  this.particleSource.forEachAlive(function(p) {
    p.kill();
    if(p.smellEmitter !== undefined) {
      p.smellEmitter.stop();
    }
  }, this);
};

Rob.Emitter.prototype.update = function() {
  this.frameCount++;

  if(this.on) {
    if(this.frameCount > this.previousEmit + this.interval) {
      this.emit();
    }

    this.particleSource.forEachAlive(function(p) {
      if(p.smellEmitter !== undefined) {
        p.smellEmitter.update();
      }

      if(this.frameCount > p.birthStamp + this.lifetime) {
        p.kill();
      }
    }, this);
  }
};
