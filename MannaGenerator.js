Rob.MannaGenerator = function(config) {
  Object.assign(this, config);

  this.on = false;
  this.frameCount = 0;
  this.previousEmit = this.frameCount;

  if(this.particleSource === undefined) { throw "Rob.MannaGenerator needs a source of particles"; }
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

Rob.MannaGenerator.prototype.emit_ = function(parentParticle) {
  var thisParticle = this.particleSource.getFirstDead();
  if(thisParticle !== null) {
    var position = Rob.XY();

    if(parentParticle === undefined) {
      position.set(
        game.rnd.integerInRange(this.position.x - this.size.x / 2, this.position.x + this.size.x / 2),
        game.rnd.integerInRange(this.position.y - this.size.y / 2, this.position.y + this.size.y / 2)
      );
    } else {
      position.set(parentParticle); // Children start life where their parent is
      parentParticle.previousEmit = this.frameCount;  // Parent particle remember when you most recently stank
    }

    thisParticle.x = position.x; thisParticle.y = position.y;

    thisParticle.body.velocity.x = game.rnd.integerInRange(this.minVelocity.x, this.maxVelocity.x);
    thisParticle.body.velocity.y = game.rnd.integerInRange(this.minVelocity.y, this.maxVelocity.y);

    thisParticle.revive();
    thisParticle.alpha = this.visible ? 1 : 0;

    thisParticle.birthStamp = this.frameCount;      // Sprite remember when you were born
    this.previousEmit = this.frameCount;            // Generator remember the most recent birth
  }
};

Rob.MannaGenerator.prototype.emit = function() {
  if(this.parent === null) {
    this.emit_();
  } else {
    for(var i = 0; i < 2; i++) {
      // This is to make sure each food particle gets to emit one smell
      // particle before anyone else gets to emit another one
      var theLuckyNewParent = -1;
      var lastBirthByLuckyParent = this.frameCount + 1;

      this.parentGroup.forEachAlive(function(parentParticle) {
        if(parentParticle.previousEmit < lastBirthByLuckyParent) {
          theLuckyNewParent = this.parentGroup.getIndex(parentParticle);
          lastBirthByLuckyParent = parentParticle.previousEmit;
        }
      }, this);

      if(theLuckyNewParent !== -1) {
        this.emit_(this.parentGroup.getChildAt(theLuckyNewParent));
      }
    }
  }
};

Rob.MannaGenerator.prototype.start = function() {
  this.on = true;
};

Rob.MannaGenerator.prototype.stop = function() {
  this.on = false;

  this.particleSource.forEachAlive(function(p) {
    p.kill();
  }, this);
};

Rob.MannaGenerator.prototype.update = function() {
  this.frameCount++;

  if(this.on) {
    if(this.frameCount >= this.previousEmit + this.interval) {
      this.emit();
    }

    this.particleSource.forEachAlive(function(p) {
      if(this.frameCount >= p.birthStamp + this.lifetime) {
        p.kill();
      }
    }, this);
  }
};
