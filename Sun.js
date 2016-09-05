/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game, Phaser, Rob */

"use strict";

Rob.Sun = function() {
  theSun = this;  // jshint ignore: line
  this.darknessAlphaHi = 0.3;
  this.darknessAlphaLo = 0.0;

  this.sunChariotAlphaHi = 1.0;
  this.sunChariotAlphaLo = 0.0;

  this.dayLength = 60000;
  this.easingFunction = Phaser.Easing.Quartic.InOut;

  this.letThereBeDark();
  //this.letThereBeLight();
  this.letThereBeFoo();
};

Rob.Sun.prototype.getBrightnessRange = function() {
  // Remember, sun is backward because it is colder when the
  // alpha of the darkness is high
  return Rob.Range(this.darknessAlphaHi, this.darknessAlphaLo);
};

// As a percentage -- 100% = full, broad daylight
Rob.Sun.prototype.getStrength = function() {
  return (this.darknessAlphaHi - this.darkness.alpha) /
    (this.darknessAlphaHi - this.darknessAlphaLo);
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
    {alpha: this.darknessAlphaLo}, this.dayLength, this.easingFunction, true, 0, -1, true
  );

  //this.darkness.visible = false;  // So I can see the debug lines while debugging
};

Rob.Sun.prototype.letThereBeFoo = function() {
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

Rob.Sun.prototype.letThereBeLight = function() {
  this.sunChariot = game.add.sprite(-100, -40, game.cache.getBitmapData('realityGoo'));

  this.sunChariot.anchor.setTo(0.5, 0.5);
  this.sunChariot.scale.setTo(2, 1);
  this.sunChariot.alpha = 1;

  var sunColor = 0xF5EE2F;
  //var moonColor = 0x888888;
  this.sunChariot.tint = sunColor;

  this.sunTween = game.add.tween(this.sunChariot).
  to({ x: game.width + 100 }, this.dayLength, Phaser.Easing.Linear.InOut, true, this.dayLength / 2, -1, true);

  // On the way back, it's the moon
  var _this = this;

  setTimeout(function() {
    setInterval(function() {
      _this.sunChariot.alpha = (_this.sunChariot.alpha === 0) ? 1 : 0;
      //_this.sunChariot.tint = (_this.sunChariot.tint === sunColor) ? moonColor : sunColor
    }, _this.dayLength);
  }, _this.dayLength / 2);

  //this.darkness.visible = false;  // So I can see the debug lines while debugging
};
