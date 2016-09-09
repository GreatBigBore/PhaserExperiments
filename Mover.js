/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global Rob */

"use strict";

Rob.Mover = function() {
};

Rob.Mover.prototype.init = function(archon) {
  this.archon = archon;
  this.sprite = archon.sprite;
  this.body = archon.sprite.body;
  this.sensor = archon.sensor;
  this.dna = archon.dna;
  this.motioner = archon.motioner;
};

Rob.Mover.prototype.avoid = function(him) {
  this.motioner.avoid(him);
};

Rob.Mover.prototype.ensoul = function() {
  this.dna = this.archon.dna;
  this.frameCount = 0;

  this.sprite.tint = this.dna.getTint();
  this.tasteCount = 0;
  this.smellCount = 0;
};

Rob.Mover.prototype.eat = function(foodParticle) {
  this.motioner.eat(foodParticle);
};

Rob.Mover.prototype.smell = function(smellyParticle) {
  this.motioner.smell(smellyParticle);
};

Rob.Mover.prototype.taste = function(tastyParticle) {
  this.motioner.taste(tastyParticle);
};

Rob.Mover.prototype.update = function() {
  this.frameCount++;
  this.motioner.update();
};
