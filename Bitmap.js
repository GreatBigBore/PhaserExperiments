Bitmap = function(width, height) {
  this.bm = game.add.bitmapData(width, height);
  this.cx = this.bm.context;

	game.add.image(0, 0, this.bm);
};

Bitmap.prototype.clear = function() {
  this.cx.clearRect(0, 0, game.width, game.height);
};

Bitmap.prototype.draw = function(xyStart, xyEnd, style, width) {
  if(style === undefined) { style = 'rgb(255, 255, 255)'; }
  if(width === undefined) { width = 1; }

  this.cx.strokeStyle = style;
  this.cx.lineWidth = width;

  this.cx.beginPath();
  this.cx.moveTo(xyStart.x, xyStart.y);
  this.cx.lineTo(xyEnd.x, xyEnd.y);
  this.cx.stroke();
};
