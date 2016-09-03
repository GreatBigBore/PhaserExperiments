
var game = null;
var runWhichState = 'Spreader';
window.onload = function() { Rob.go(runWhichState); }

var Rob = {
  go: function(runWhichState) {
    game = new Phaser.Game(640, 480, Phaser.CANVAS);

    var states = [
      'Angles', 'Mover', 'Spreader'
    ];

    for(var i in states) {
      game.state.add(states[i], Rob[states[i]], false);
    }

    game.state.start(runWhichState);
  }
};
