/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game, Phaser, Rob */

"use strict";

Rob.Sun = function() {
  theSun = this;  // jshint ignore: line

  this.sunChariotAlphaHi = 1.0;
  this.sunChariotAlphaLo = 0.0;

  this.dayLength = 60000;
  this.easingFunction = Phaser.Easing.Quartic.InOut;

  this.letThereBeDark();
  //this.letThereBeLight();
  this.letThereBeFoo();
};

Rob.Sun.prototype.getStrength = function() {
  // We have to clamp it because the actual sprite alpha can go slightly
  // negative when it's supposed to stop at zero.
  return Rob.clamp(
    Rob.globals.zeroToOneRange.convertPoint(
      this.darkness.alpha, Rob.globals.darknessRange
    ), 0, 1
  );
};

Rob.Sun.prototype.letThereBeDark = function() {
  this.darkness = game.add.sprite(
    (game.world.width / 2 - 100),
    (game.world.height / 2 - 100),
    game.cache.getBitmapData('realityGoo')
  );

  this.darkness.anchor.setTo(0.5, 0.5);
  this.darkness.scale.setTo(10, 10);  // Any size is fine, as long as it covers the world
  this.darkness.alpha = Rob.globals.darknessAlphaHi;       // Note: black sprite, so high alpha means dark world
  this.darkness.tint = 0x9900;

  game.add.tween(this.darkness).to(
    {alpha: Rob.globals.darknessAlphaLo}, this.dayLength, this.easingFunction, true, 0, -1, true
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
