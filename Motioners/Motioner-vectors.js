/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global Rob, theSpreader */

"use strict";

Rob.Motioner = function() {
  this.frameCount = 0;

  this.vectors = {
    motion: Rob.XY(),
    smell: Rob.XY(),
    taste: Rob.XY(),
    temp: Rob.XY()
  };

  this.senseCounts = { smell: 0, taste: 0 };

  this.debugText = "";
};

Rob.Motioner.prototype.init = function(archon) {
  this.archon = archon;
  this.sprite = archon.sprite;
  this.body = archon.sprite.body;
  this.mover = archon.mover;
  this.sensor = archon.sensor;
  this.dna = archon.dna;
};

Rob.Motioner.prototype.ensoul = function() {
  this.zeroToOneRange = Rob.Range(0, 1);
  this.senseRange = Rob.Range(1 / Math.pow(this.sensor.width / 2, 2), 1);
  this.tempRange = Rob.Range(this.dna.optimalLoTemp, this.dna.optimalHiTemp);
  this.hungerRange = Rob.Range(0, this.dna.embryoThreshold);
  this.speedRange = Rob.Range(-Rob.globals.maxSpeed, Rob.globals.maxSpeed);
};

Rob.Motioner.prototype.eat = function() {

};

Rob.Motioner.prototype.getTempVector = function() {
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

  var bestT = testPoints[bestIndex].d;
  var myPointOnTheNormalScale = this.zeroToOneRange.convertPoint(bestT, this.tempRange);

  this.vectors.temp.set(0, myPointOnTheNormalScale);

  this.debugText += "temp : (0.0000, " + myPointOnTheNormalScale.toFixed(4) + ")\n";
};

Rob.Motioner.prototype.getSenseVector = function(sense) {
  // Get the average of all the smell points
  if(this.senseCounts[sense] !== 0) {
    this.vectors[sense].scalarDivide(this.senseCounts[sense]);

    var m = this.vectors[sense].getMagnitude();
    var c = this.zeroToOneRange.convertPoint(m, this.senseRange);

    this.vectors[sense].scalarDivide(c);

    this.senseCounts[sense] = 0;
  }

  this.debugText += sense + ": (" + this.vectors[sense].X(4) + ", " + this.vectors[sense].Y(4) + ")\n";
};

Rob.Motioner.prototype.sense = function(sense, sensee) {
  var relativePosition = Rob.XY(sensee).minus(this.sprite);
  var distance = relativePosition.getMagnitude();

  // Value falls off like gravity
  var value = 1 / Math.pow(distance, 2);

  this.vectors[sense].add(relativePosition).scalarMultiply(value);
  this.senseCounts[sense]++;

  var color = sense === 'smell' ? 'yellow' : 'cyan';
  Rob.db.draw(this.sprite, sensee, color);
};

Rob.Motioner.prototype.getTasteVector = function() {
  this.getSenseVector('taste');
};

Rob.Motioner.prototype.getSmellVector = function() {
  this.getSenseVector('smell');
};

Rob.Motioner.prototype.smell = function(smellyParticle) {
  this.sense('smell', smellyParticle);
  this.smellCount++;
};

Rob.Motioner.prototype.taste = function(tastyParticle) {
  this.sense('taste', tastyParticle);
  this.tasteCount++;
};

Rob.Motioner.prototype.update = function() {
  this.getTempVector();
  this.getSmellVector();
  this.getTasteVector();

  this.dna.tempFactor = 1;
  this.dna.smellFactor = 1;
  this.dna.tasteFactor = 2;
  this.dna.velocityFactor = 1;

  if(this.frameCount % 10 === 0) {
  /*  theSpreader.debugText(
      "˚: " + this.vectors.temp.X(4) + ", " + this.vectors.temp.Y(4) + "\n" +
      "s: " + this.vectors.smell.X(4) + ", " + this.vectors.smell.Y(4) + "\n" +
      "t: " + this.vectors.taste.X(4) + ", " + this.vectors.taste.Y(4)
    );*/

    this.vectors.motion.reset();
    this.vectors.motion.add(this.vectors.temp.timesScalar(this.dna.tempFactor));
    this.vectors.motion.add(this.vectors.taste.timesScalar(this.dna.tasteFactor));
    this.vectors.motion.add(this.vectors.smell.timesScalar(this.dna.smellFactor));
    this.vectors.motion.normalize().scalarMultiply(Rob.globals.maxSpeed);

    this.body.velocity.setTo(this.vectors.motion.x, this.vectors.motion.y);

    Rob.db.draw(
      this.sprite,
      this.vectors.motion.normalized().timesScalar(this.sensor.width / 2).plus(this.sprite),
      'green', 1
    );

    Rob.db.text(0, 0, this.debugText);
    this.debugText = "";
  }

  this.sensor.x = this.sprite.x; this.sensor.y = this.sprite.y;

  for(var i in this.vectors) {
    this.vectors[i].reset();
  }
};
