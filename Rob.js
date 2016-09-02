
var game = null;
var runWhichState = 'Mover';
window.onload = function() { Rob.go(runWhichState); }

var Rob = {
  go: function(runWhichState) {
    game = new Phaser.Game(640, 480, Phaser.CANVAS);
    game.state.add('Angles', Rob.Angles, false);
    game.state.add('Mover', Rob.Mover, false);

    game.state.start(runWhichState);
  }
};
