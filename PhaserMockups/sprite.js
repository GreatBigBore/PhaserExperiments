var setCircle = function() {};
var setSize = function() {};
var setTo = function() {};
var syncBounds = function() {};
var bounce = { setTo: setTo };

module.exports = {
  x: 0, y: 0,

  anchor: { setTo: setTo },

  body: {
    bounce: bounce, collideWorldBounds: false, setCircle: setCircle, setSize: setSize, syncBounds: syncBounds,
    velocity: { x: 0, y: 0 }
  },

  bounce: bounce,
  input: { enableDrag: function() {} },
  scale: { setTo: setTo }
}
