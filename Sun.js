/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game, Rob */

"use strict";

Rob.Sun = function() {
  this.darknessAlphaHi = 0.3;
  this.darknessAlphaLo = 0.0;
  this.dayLength = 60000;

  this.letThereBeDark();
};

// As a percentage -- 100% = full, broad daylight
Rob.Sun.prototype.getStrength = function() {
  var range = this.darknessAlphaHi - this.darknessAlphaLo;

  return (this.darknessAlphaHi - this.darkness.alpha) / range;
};

Rob.Sun.prototype.letThereBeDark = function() {
  this.darkness = game.add.sprite(
    (game.world.width / 2),
    (game.world.height / 2),
    game.cache.getBitmapData('realityGoo')
  );

  this.darkness.anchor.setTo(0.5, 0.5);
  this.darkness.scale.setTo(10, 10);  // Any size is fine, as long as it covers the world
  this.darkness.alpha = this.darknessAlphaHi;       // Note: black sprite, so high alpha means dark world
  this.darkness.tint = 0x9900;

  game.add.tween(this.darkness).to(
    {alpha: this.darknessAlphaLo}, this.dayLength, "Sine.easeInOut", true, 0, -1, true
  );

  //this.darkness.visible = false;  // So I can see the debug lines while debugging

  this.foo = game.add.sprite(0, 0, game.cache.getBitmapData('realityGoo'));
  this.foo.kill();  // Invisible until I need it for debugging

  this.foo.anchor.setTo(0.5, 0.5);
  this.foo.scale.setTo(0.05, 0.05);  // Any size is fine, as long as it covers the world
  this.foo.tint = 0x00FF00;

  this.bar = game.add.sprite(0, 0, game.cache.getBitmapData('realityGoo'));
  this.bar.kill();  // Invisible until I need it for debugging

  this.bar.anchor.setTo(0.5, 0.5);
  this.bar.scale.setTo(0.05, 0.05);  // Any size is fine, as long as it covers the world
  this.bar.tint = 0xFF0000;
};
