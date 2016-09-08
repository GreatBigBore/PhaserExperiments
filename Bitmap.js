/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* global game, Phaser, Rob */

"use strict";

Rob.Bitmap = function(whichBitmap) {
  switch(whichBitmap) {
    case 'archonBackground':
    case 'debugBackground':
    case 'rectGradient':
    case 'realityGoo':
    this[whichBitmap]();
    break;
    default: throw "No '" + whichBitmap + "' background available";
  }

  this.cx = this.bm.context;


  this.txStyle = {
    font: "12pt Courier", fill: "blue", wordWrap: false,
    align: "left", backgroundColor: null
  };

  this.tx = game.add.text(0, 0, "", this.txStyle);
  this.tx.width = game.width / 2; this.tx.height = game.height / 2;
  this.tx.anchor.set(0);
};

Rob.Bitmap.prototype.archonBackground = function() {
  this.bmDiagonal = Math.ceil(
    Math.sqrt(Math.pow(game.width, 2) + Math.pow(game.height, 2))
  );

  this.bmRadius = Math.ceil(this.bmDiagonal / 2);

  var x = game.width / 2;
  var y = game.height / 2;

  this.bm = game.make.bitmapData(this.bmDiagonal, this.bmDiagonal);

  this.innerCircle = new Phaser.Circle(1, 1, 1);
  this.outerCircle = new Phaser.Circle(x, y, this.bmDiagonal);

  var g = this.bm.context.createRadialGradient(
    this.innerCircle.x, this.innerCircle.y, this.innerCircle.radius,
    this.outerCircle.x, this.outerCircle.y, this.outerCircle.radius
  );

  g.addColorStop(0.00, 'hsl(202, 100%, 100%)');
  g.addColorStop(0.40, 'hsl(202, 100%, 50%)');
  g.addColorStop(0.70, 'hsl(202, 100%, 50%)');
  g.addColorStop(0.90, 'hsl(218, 100%, 40%)');
  g.addColorStop(1.00, 'hsl(218, 100%, 00%)');

  this.bm.circle(x, y, this.bmDiagonal, g);
  this.bm.update();
  this.bm.addToWorld();
};

Rob.Bitmap.prototype.clear = function() {
  this.cx.clearRect(0, 0, game.width, game.height);
};

Rob.Bitmap.prototype.realityGoo = function() {
  var diameter = 100;
  var radius = diameter / 2;

  this.bm = game.add.bitmapData(diameter, diameter);
  this.cx = this.bm.context;

  this.cx.beginPath();
  this.bm.circle(radius, radius, radius, 'rgba(255, 255, 255, 1)');
  this.cx.fill();

  game.cache.addBitmapData('realityGoo', this.bm);
};

Rob.Bitmap.prototype.debugBackground = function() {
  this.bm = game.add.bitmapData(game.width, game.height);
  this.cx = this.bm.context;

  this.cx.fillStyle = 'rgba(255, 255, 255, 1)';
  this.cx.strokeStyle = 'rgba(255, 255, 255, 1)';

  game.add.image(0, 0, this.bm);
};

Rob.Bitmap.prototype.draw = function(xyStart, xyEnd, style, width) {
  if(style === undefined) { style = 'rgb(255, 255, 255)'; }
  if(width === undefined) { width = 1; }

  this.cx.strokeStyle = style;
  this.cx.lineWidth = width;

  this.cx.beginPath();
  this.cx.moveTo(xyStart.x, xyStart.y);
  this.cx.lineTo(xyEnd.x, xyEnd.y);
  this.cx.stroke();
};

Rob.Bitmap.prototype.rectGradient = function() {
  this.bm = game.add.bitmapData(game.width, game.height);
  this.cx = this.bm.context;

  var g = this.cx.createLinearGradient(game.width / 2, 0, game.width / 2, game.height);

  g.addColorStop(0.00, 'hsl(202, 100%, 100%)');
  g.addColorStop(0.40, 'hsl(202, 100%, 50%)');
  g.addColorStop(0.70, 'hsl(202, 100%, 50%)');
  g.addColorStop(0.90, 'hsl(218, 100%, 40%)');
  g.addColorStop(1.00, 'hsl(218, 100%, 00%)');

  this.cx.fillStyle = g;
  this.cx.fillRect(0, 0, game.width, game.height);

  this.bm.update();
  game.add.image(0, 0, this.bm);

  // Hacking this in to create boundaries; maybe clean it up later
  game.cache.addBitmapData('rectGradient', this.bm);
};

Rob.Bitmap.prototype.text = function(x, y, text) {
  this.tx.setText(text);
};

Rob.Bitmap.prototype.update = function() {
  this.clear();
};
