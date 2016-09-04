/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game, Phaser, Rob */

"use strict";

Rob.MannaGenerator = function(config, db) {
  this.db = db;
  this.config = Object.assign({}, config);
  this.originalConfig = Object.assign({}, config);

  this.on = false;
  this.frameCount = 0;
  this.previousEmit = this.frameCount;

  if(this.config.particleSource === undefined) { throw "Rob.MannaGenerator needs a source of particles"; }
  if(this.config.interval === undefined) { this.config.interval = 60; }
  if(this.config.lifetime === undefined) { this.config.lifetime = 60; }
  if(this.config.visible === undefined) { this.config.visible = true; }
  if(this.config.size === undefined) { this.config.size = Rob.XY(); } else { this.config.size = Rob.XY(config.size); }
  if(this.config.position === undefined) { this.config.position = Rob.XY(); }
    else { this.config.position = Rob.XY(config.position); }

  if(this.config.minVelocity === undefined) { this.config.minVelocity = Rob.XY(); }
    else { this.config.minVelocity = Rob.XY(config.minVelocity); }

  if(this.config.maxVelocity === undefined) { this.config.maxVelocity = Rob.XY(); }
    else { this.config.maxVelocity = Rob.XY(config.maxVelocity); }
};

Rob.MannaGenerator.prototype.emit_ = function(parentParticle) {
  var thisParticle = this.config.particleSource.getFirstDead();
  if(thisParticle !== null) {
    var position = Rob.XY();

    if(parentParticle === undefined) {
      position.set(
        game.rnd.integerInRange(
          this.config.position.x - this.config.size.x / 2,
          this.config.position.x + this.config.size.x / 2
        ),

        game.rnd.integerInRange(
          this.config.position.y - this.config.size.y / 2,
          this.config.position.y + this.config.size.y / 2
        )
      );
    } else {
      position.set(parentParticle); // Children start life where their parent is
      parentParticle.previousEmit = this.frameCount;  // Parent particle remember when you most recently stank
    }

    thisParticle.x = position.x; thisParticle.y = position.y;

    thisParticle.body.velocity.x = game.rnd.integerInRange(
      this.config.minVelocity.x, this.config.maxVelocity.x
    );

    thisParticle.body.velocity.y = game.rnd.integerInRange(
      this.config.minVelocity.y, this.config.maxVelocity.y
    );

    thisParticle.revive();
    thisParticle.alpha = this.config.visible ? 1 : 0;

    thisParticle.birthStamp = this.frameCount;      // Sprite remember when you were born
    this.previousEmit = this.frameCount;            // Generator remember the most recent birth
  }
};

Rob.MannaGenerator.prototype.emit = function() {
  if(this.config.parent === null) {
    this.emit_();
  } else {
    for(var i = 0; i < 2; i++) {
      // This is to make sure each food particle gets to emit one smell
      // particle before anyone else gets to emit another one
      var theLuckyNewParent = -1;
      var lastBirthByLuckyParent = this.frameCount + 1;

      this.config.parentGroup.forEachAlive(function(parentParticle) {
        if(parentParticle.previousEmit < lastBirthByLuckyParent) {
          theLuckyNewParent = this.config.parentGroup.getIndex(parentParticle);
          lastBirthByLuckyParent = parentParticle.previousEmit;
        }
      }, this);

      if(theLuckyNewParent !== -1) {
        this.emit_(this.config.parentGroup.getChildAt(theLuckyNewParent));
      }
    }
  }
};

Rob.MannaGenerator.prototype.setEfficiency = function(efficiency) {
  efficiency = Math.min(1, efficiency); efficiency = Math.max(0, efficiency);

  if(efficiency < 0.1) {
    this.stop();
  } else {
    var scratch = Object.assign({}, this.originalConfig);

    var myResult = Math.ceil(60 * Math.pow(2, ((1 - efficiency) * 8) - 7));
    scratch.interval = myResult;

/*    if(this.db !== undefined)
      this.db.text(
        0, 0,
        "Interval: " + myResult +
        ", lifetime: " + scratch.lifetime.toFixed(0) +
        ", minv: " + scratch.minVelocity.X() + ", " + scratch.minVelocity.Y() +
        ", maxv: " + scratch.maxVelocity.X() + ", " + scratch.maxVelocity.Y()
      );*/

    this.config = Object.assign({}, scratch);

    this.start();
  }
};

Rob.MannaGenerator.prototype.start = function() {
  this.on = true;
};

Rob.MannaGenerator.prototype.stop = function() {
  this.on = false;

  this.config.particleSource.forEachAlive(function(p) {
    p.kill();
  }, this);
};

Rob.MannaGenerator.prototype.update = function() {
  this.frameCount++;

  if(this.on) {
    if(this.frameCount >= this.previousEmit + this.config.interval) {
      this.emit();
    }

    this.config.particleSource.forEachAlive(function(p) {
      if(this.frameCount >= p.birthStamp + this.config.lifetime) {
        p.kill();
      }
    }, this);
  }
};
