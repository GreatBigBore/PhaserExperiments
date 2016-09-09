/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game, Rob */

"use strict";

Rob.Motioner = function() {
  this.frameCount = 0;

  this.vectors = {
    avoidance: Rob.XY(),
    motion: Rob.XY(),
    smell: Rob.XY(),
    taste: Rob.XY(),
    temp: Rob.XY()
  };

  this.senseCounts = { avoidance: 0, smell: 0, taste: 0 };
};

Rob.Motioner.prototype.avoid = function(him) {
  this.senseCompetitor(him);
};

Rob.Motioner.prototype.getAvoidanceVector = function() {
  this.getSenseVector('avoidance');
};

Rob.Motioner.prototype.init = function(archon) {
  this.archon = archon;
  this.sprite = archon.sprite;
  this.body = archon.sprite.body;
  this.mover = archon.mover;
  this.lizer = archon.lizer;
  this.sensor = archon.sensor;
  this.dna = archon.dna;
};

Rob.Motioner.prototype.ensoul = function() {
  this.zeroToOneRange = Rob.globals.zeroToOneRange;

  var radius = this.sensor.width / 2;

  this.senseRange = Rob.Range(-radius, radius);
  this.hungerRange = Rob.Range(0, this.dna.embryoThreshold);
  this.speedRange = Rob.Range(-Rob.globals.maxSpeed, Rob.globals.maxSpeed);
  this.centeredZeroToOneRange = Rob.Range(-0.5, 0.5);
};

Rob.Motioner.prototype.eat = function() {

};

Rob.Motioner.prototype.getTempVector = function() {
  var testPoints = [];

  var addCandidate = function(_this, where) {
    if(where.y > 0 && where.y < game.height && where.x > 0 && where.x < game.width) {
      var p = where;
      var t = Rob.getTemperature.call(_this, where);
      var d = t - _this.dna.optimalTemp;
      var a = Math.abs(d);

      testPoints.push({ p: p, t: t, d: d, a: a});
    }
  };

  addCandidate(this, Rob.XY(this.sensor.x, this.sensor.y - this.sensor.width / 2));
  addCandidate(this, Rob.XY(this.sensor));
  addCandidate(this, Rob.XY(this.sensor.x, this.sensor.y + this.sensor.width / 2));

  if(testPoints.length === 0) {
    console.log('wtf temp vector got no love');
    this.vectors.temp.set(0, 0);
  } else {
    var bestDelta = testPoints[0].a;
    var bestIndex = 0;
    for(var i = 0; i < testPoints.length; i++) {
      if(testPoints[i].a < bestDelta) {
        bestIndex = i;
        bestDelta = testPoints[i].a;
      }
    }

    var bestD = testPoints[bestIndex].d;

    var myPointOnTheNormalScale = this.centeredZeroToOneRange.convertPoint(
      bestD, Rob.globals.standardArchonTolerableTempRange
    );

    this.vectors.temp.set(0, myPointOnTheNormalScale);
  }
};

Rob.Motioner.prototype.getSenseVector = function(sense) {
  if(this.senseCounts[sense] !== 0) {
    var debugText = "";

    //Rob.debugText += "sv0 (" + this.vectors.smell.x + ", " + this.vectors.smell.y + ")\n"
    debugText += (
      'Summary ' + sense + ': ' +
      ' count ' + this.senseCounts[sense] +
      ' vector before (' + this.vectors[sense].X() + ', ' + this.vectors[sense].Y() + ')'
    );

    roblog('senses', debugText); debugText = "";

    this.vectors[sense].scalarDivide(this.senseCounts[sense]);

    //Rob.debugText += "sv1 (" + this.vectors.smell.x + ", " + this.vectors.smell.y + ")\n"

    var m = this.vectors[sense].getMagnitude();
    var c = this.centeredZeroToOneRange.convertPoint(m, this.senseRange);

    if(m < c) {
      console.log('wtf m < c');
      this.vectors[sense].set(0, 0);
    } else {
      this.vectors[sense].scalarMultiply(c / m);
      //Rob.debugText += "sv2 (" + this.vectors.smell.x + ", " + this.vectors.smell.y + ")\n"
    }

    debugText += (
      ' vector after (' + this.vectors[sense].X() + ', ' + this.vectors[sense].Y() + ')' +
      ' m = ' + m + ', c = ' + c + ', new m = ' + (c / m).toFixed(4)
    );

    roblog('senses', debugText); debugText = "";
  }
};

Rob.Motioner.prototype.sense = function(sense, sensee) {
  var debugText = "";

  var radius = this.sensor.width / 2;
  var relativePosition = Rob.XY(sensee).minus(this.sensor);

  var distance = relativePosition.getMagnitude();
  distance = Rob.clamp(distance, 0, radius);

  var value = radius - distance;

  relativePosition.scalarMultiply(value);
  this.vectors[sense].add(relativePosition);
  this.senseCounts[sense]++;

  debugText += (
    'sense ' + sense +
    ' distance ' + distance +
    ' value ' + value +
    ' vector (' + relativePosition.X() + ', ' + relativePosition.Y() + ')'
  );

  roblog('senses', debugText);

  var color = null;
  switch(sense) {
    case 'smell': color = 'yellow'; break;
    case 'taste': color = 'cyan'; break;
    default: throw "Bad sense '" + sense + "'";
  }

  Rob.db.draw(this.sprite, sensee, color);
};

Rob.Motioner.prototype.senseCompetitor = function(sensee) {
  if(this.archon.uniqueID !== sensee.archon.uniqueID) {
    var relativePosition = Rob.XY(sensee).minus(this.sensor);
    var distance = relativePosition.getMagnitude();

    // Value falls off like gravity
    var value = 1 / Math.pow(distance, 3);
    value *= this.lizer.getMass() / sensee.archon.lizer.getMass();
    Rob.clamp(value, 1, 1);

    relativePosition.scalarMultiply(value);
    this.vectors.avoidance.add(relativePosition);
    this.senseCounts.avoidance++;
  }

  Rob.db.draw(this.sprite, sensee, 'blue');
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
  this.frameCount++;

  this.getTempVector();
  this.getSmellVector();
  this.getTasteVector();
  this.getAvoidanceVector();

  if(this.senseCounts.taste > 0) {
    // If there's food in our sense range rather than
    // just the smell of food, then let's add a lot
    // more weight to the actual food. Heavily weight
    // the food and add only a fraction of the smell.
    // Note that the taste vector has all the info now,
    // so we zero out the smell vector
    var foodFactor = 5;

    this.vectors.taste.scalarMultiply(foodFactor);
    this.vectors.taste.add(this.vectors.smell);
    this.vectors.taste.scalarDivide(foodFactor + 1);
    this.vectors.smell.set(0, 0);
  }

  this.dna.tempFactor = 1;
  this.dna.smellFactor = 1;
  this.dna.tasteFactor = 1;
  this.dna.velocityFactor = 1;
  this.dna.avoidanceFactor = -15;
  if(this.saveDebugText === undefined) {
    this.saveDebugText = Rob.debugText;
  }

  if(this.frameCount % 10 === 0) {
    this.vectors.motion.reset();
    /*this.vectors.temp.scalarMultiply(this.dna.tempFactor);
    this.vectors.motion.add(this.vectors.temp);
    var m = this.vectors.motion.getMagnitude();
    var n = this.speedRange.convertPoint(m, this.centeredZeroToOneRange);
    this.vectors.motion.scalarMultiply(n);*/

    //Rob.debugText += "Vector before (" + this.vectors.smell.x + ", " + this.vectors.smell.y + ")\n"

    this.vectors.smell.scalarMultiply(this.dna.smellFactor);
    this.vectors.motion.add(this.vectors.smell);
    this.vectors.taste.scalarMultiply(this.dna.tasteFactor);
    this.vectors.motion.add(this.vectors.taste);

    var m = this.vectors.motion.getMagnitude() / 2; // div by 2 for the average
    var n = this.speedRange.convertPoint(m, this.centeredZeroToOneRange);
    this.vectors.motion.scalarMultiply(n);

    //Rob.debugText += "Vector after (" + this.vectors.motion.x + ", " + this.vectors.motion.y + ")\n"

    if(this.archon.stopped) {
      this.body.velocity.setTo(0, 0);
    } else {
      this.body.velocity.setTo(this.vectors.motion.x, this.vectors.motion.y);
    }

    Rob.db.draw(
      this.sprite,
      this.vectors.motion.normalized().timesScalar(this.sensor.width / 2).plus(this.sprite),
      'green', 1
    );
  }

  if(this.archon.uniqueID === 0) {
    Rob.db.text(0, 0, this.saveDebugText);

    if(this.frameCount % 30 === 0) {
      this.saveDebugText = Rob.debugText;
    }
  }

  Rob.debugText = "";

  this.sensor.x = this.sprite.x; this.sensor.y = this.sprite.y;

  for(var i in this.vectors) { this.vectors[i].reset(); }
  for(i in this.senseCounts) { this.senseCounts[i] = 0; }


};
