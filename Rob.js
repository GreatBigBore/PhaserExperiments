var Rob = function() {
};

Rob.prototype.create = function() {
  this.mainBitmap = new Bitmap(game.width, game.height);

  this.alien = this.add.sprite(game.width / 2, game.height / 2, 'alien');
  this.alien.anchor.set(0.5, 0.5);
  this.alien.inputEnabled = true;
  this.alien.input.enableDrag();
};

Rob.prototype.init = function() {
};

Rob.prototype.preload = function() {
  this.load.image('alien', 'assets/sprites/ufo.png');
};

Rob.prototype.update = function() {
  this.mainBitmap.clear();
  this.mainBitmap.draw({x: 0, y: 0}, {x: this.alien.x, y: this.alien.y}, 'red', 2);
};

var game = new Phaser.Game(640, 480, Phaser.CANVAS);
game.state.add('Rob', Rob, true);
