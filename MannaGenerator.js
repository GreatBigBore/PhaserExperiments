/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global Rob */

"use strict";

Rob.MannaGenerator = function(config, db) {
  this.uniqueID = 0;
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
      if(thisParticle.uniqueID === undefined) {
        thisParticle.uniqueID = this.uniqueID++;
      }

      position.set(
        Rob.integerInRange(
          this.config.position.x - this.config.size.x / 2,
          this.config.position.x + this.config.size.x / 2
        ),

        Rob.integerInRange(
          this.config.position.y - this.config.size.y / 2,
          this.config.position.y + this.config.size.y / 2
        )
      );

      if(position.y < this.config.position.y - this.config.size.y / 4) {
        // When to emit our first bubble
        this.setNextEmit(thisParticle);
      } else {
        thisParticle.nextEmit = -1;   // only the topmost manna emits bubbles
      }

    } else {
      this.setNextEmit(parentParticle); // When to emit our next bubble
      position.set(parentParticle);     // Children start life where their parent is
    }

    // Somewhat random expiration, hopefully will make it
    // look more natural, or at least less mechanical
    thisParticle.expirationDate = this.frameCount +
      Rob.integerInRange(this.config.lifetime / 2, this.config.lifetime);

    thisParticle.x = position.x; thisParticle.y = position.y;

    thisParticle.body.velocity.x = Rob.integerInRange(
      this.config.minVelocity.x, this.config.maxVelocity.x
    );

    thisParticle.body.velocity.y = Rob.integerInRange(
      this.config.minVelocity.y, this.config.maxVelocity.y
    );

    thisParticle.revive();
    thisParticle.alpha = this.config.visible ? 1 : 0.1;

    this.previousEmit = this.frameCount;            // Generator remember the most recent birth
  }
};

Rob.MannaGenerator.prototype.emit = function() {
  if(this.config.parent === null) {
    // Manna can only be emitted at the intervals
    var elapsedSinceLastEmit = this.frameCount - this.previousEmit;
    while(elapsedSinceLastEmit >= 0) {
      this.emit_();

      elapsedSinceLastEmit -= this.config.interval;
    }
  } else {
    // Bubbles can come out of living manna at any time
    this.config.parentGroup.forEachAlive(function(parentParticle) {
      if(
        parentParticle.nextEmit > 0 &&
        this.frameCount >= parentParticle.nextEmit
      ) {
        this.emit_(parentParticle);
      }
    }, this);
  }
};

Rob.MannaGenerator.prototype.setNextEmit = function(mannaParticle) {
  var r = Rob.integerInRange(30, 60);
  mannaParticle.nextEmit = this.frameCount + r;
};

Rob.MannaGenerator.prototype.start = function() {
  this.on = true;
};

Rob.MannaGenerator.prototype.kill = function(particle) {
  particle.kill();

  if(particle.nextEmit !== undefined) {
    particle.nextEmit = -1;
  }
};

Rob.MannaGenerator.prototype.stop = function() {
  this.on = false;

  this.config.particleSource.forEachAlive(function(p) {
    this.kill(p);
  }, this);
};

Rob.MannaGenerator.prototype.tick = function() {
  this.frameCount++;

  if(this.on) {
    this.emit();  // Not necessarily an emit; each particle has its own timers

    this.config.particleSource.forEachAlive(function(p) {
      if(this.frameCount >= p.expirationDate) {
        this.kill(p);
      }
    }, this);
  }
};
