var game = module.exports = {
  rnd: { 
    realInRange: function(lo, hi) { return Math.random() * (hi - lo) + lo; },
    integerInRange: function(lo, hi) {  return Math.floor(game.rnd.realInRange(lo, hi)); }
  },
  
  physics: {
    enable: function() {}
  }
};
