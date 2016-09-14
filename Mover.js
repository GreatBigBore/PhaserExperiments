/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global Rob */

"use strict";

Rob.Mover = function() {
};

Rob.Mover.prototype.avoid = function(him) {
  this.motioner.avoid(him);
};

Rob.Mover.prototype.launch = function() {
  this.frameCount = 0;

  this.tasteCount = 0;
  this.smellCount = 0;
};

Rob.Mover.prototype.eat = function(foodParticle) {
  this.archon.organs.motioner.eat(foodParticle);
};

Rob.Mover.prototype.ready = function(archon) {
  this.archon = archon;
  this.organs = Object.assign({}, archon.organs);
};

Rob.Mover.prototype.smell = function(smellyParticle) {
  this.archon.organs.motioner.smell(smellyParticle);
};

Rob.Mover.prototype.taste = function(tastyParticle) {
  this.archon.organs.motioner.taste(tastyParticle);
};

Rob.Mover.prototype.tick = function(frameCount) {
  this.frameCount = frameCount;
};
