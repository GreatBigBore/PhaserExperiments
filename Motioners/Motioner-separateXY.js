/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global Rob, theSpreader */

"use strict";

Rob.Motioner = function(mover) {
  this.mover = mover;
  this.sprite = mover.sprite;
  this.body = this.mover.body;
  this.sensor = mover.sensor;
  this.dna = mover.dna;
  this.archon = mover.archon;
  this.frameCount = 0;

  this.vectors = {
    motion: Rob.XY(),
    smell: Rob.XY(),
    taste: Rob.XY(),
    temp: Rob.XY()
  };

  this.xDirection = 1;
};

Rob.Motioner.prototype.eat = function() {

};

Rob.Motioner.prototype.getTempInfo = function() {
  var testPoints = [];

  var addCandidate = function(_this, where, accept) {
    if(where.y < _this.sensor.width && !accept) {
      return;
    }

    var p = where;
    var t = theSpreader.getTemperature(where);
    var d = t - _this.dna.optimalTemp;
    var a = Math.abs(d);

    testPoints.push({ p: p, t: t, d: d, a: a});
  };

  addCandidate(this, Rob.XY(this.sprite), true);
  addCandidate(this, Rob.XY(this.sprite.x, this.sprite.y - this.sensor.width / 2), false);
  addCandidate(this, Rob.XY(this.sprite.x, this.sprite.y + this.sensor.width / 2), false);

  var bestDelta = testPoints[0].a;
  var bestIndex = 0;
  for(var i = 0; i < testPoints.length; i++) {
    if(testPoints[i].a < bestDelta) {
      bestIndex = i;
      bestDelta = testPoints[i].a;
    }
  }

  return testPoints[bestIndex];
};

Rob.Motioner.prototype.sense = function(sense, sensee) {
  var relativePosition = Rob.XY(sensee).minus(this.sprite);
  var distance = relativePosition.getMagnitude();

  // Value falls off like gravity
  var value = 1 / Math.pow(distance, 2);

  this.vectors[sense].add(relativePosition.normalized().timesScalar(value));

  if(sense === 'smell') { this.smellCount++; } else { this.tasteCount++; }
  var color = sense === 'smell' ? 'yellow' : 'cyan';
  Rob.db.draw(this.sprite, sensee, color);
};

Rob.Motioner.prototype.smell = function(smellyParticle) {
  this.sense('smell', smellyParticle);
};

Rob.Motioner.prototype.taste = function(tastyParticle) {
  this.sense('taste', tastyParticle);
};

Rob.Motioner.prototype.update = function() {
  this.frameCount++;

  var tempInfo = this.getTempInfo();
  var maxSpeed = 60;

  var tolerableTempRange = Rob.Range(-200, 200);
  var speedRange = Rob.Range(-maxSpeed, maxSpeed);
  var targetSpeed = Rob.clamp(
    speedRange.convertPoint(tempInfo.d, tolerableTempRange), -maxSpeed, maxSpeed
  );

  if(this.frameCount % 10 === 0) {
    if(this.archon.stopped) {
      this.body.velocity.setTo(0, 0);
    } else {
      this.body.velocity.y = targetSpeed;
    }
  }

  this.sensor.x = this.sprite.x; this.sensor.y = this.sprite.y;

  for(var i in this.vectors) {
    this.vectors[i].reset();
  }
};
