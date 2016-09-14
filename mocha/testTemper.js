var chai = require('chai');
var Rob = require('../Temper.js');

// Just return a value based on x/y so the test can know what to expect
Rob.integerInRange = function(lo, hi) {
  return (hi - lo) / 2;
};

var archon = {
  sprite: Rob.XY(),
  dna: { optimalLoTemp: -47, optimalTemp: 62, optimalHiTemp: 137 },
  sensor: { width: 50 }
};

Rob.pointInBounds = function(where) {
  var bounds = { xlo: -50, xhi: 50, ylo: -50, yhi: 50 };

  return where.x > bounds.xlo && where.x < bounds.xhi && where.y > bounds.ylo && where.y < bounds.yhi;
};

Rob.whichTest = 0;
Rob.temperatureSettings = [
  { "-18": 108, "7": -42, "32": -192 },
  { "-65": 108, "-40": -42, "-15": -192 },
  { "-18": 1000, "7": 1500, "32": -192}
];

Rob.getTemperature = function(where) {
  var t = Rob.temperatureSettings[Rob.whichTest][where.y.toString()];
  return t;
};

describe('Temper', function() {
  describe('Test temperature vector:', function() {
    it('Should recognize temperatures within goldilocks zone', function() {
      Rob.whichTest = 0;
      var x = -6, y = 7, s = archon.sensor.width / 2;

      var pu = { x: x, y: y - s, t: 108, e: 108 - archon.organs.dna.optimalTemp };
      var pc = { x: x, y: y, t: -42, e: 0 };
      var pd = { x: x, y: y + 2, t: -192, e: archon.organs.dna.optimalTemp - (-192) };

      archon.sprite.set(pc);

      var temper = new Rob.Temper();
      temper.launch(archon);

      chai.expect(temper.getTempVector()).to.have.property('y').equal(pu.e);
    });

    it('Should skip checking temps for out-of-bounds points', function() {
      Rob.whichTest = 1;
      var x = -6, y = 7, s = archon.sensor.width / 2;

      var pu = { x: x, y: y - s, t: 108, e: 108 - archon.organs.dna.optimalTemp };
      var pc = { x: x, y: y, t: -42, e: 0 };
      var pd = { x: x, y: y + 2, t: -192, e: archon.organs.dna.optimalTemp - (-192) };

      archon.sprite.set(pc.x, -40);

      var temper = new Rob.Temper();
      temper.launch(archon);

      // With our winner out of bounds, we should get back the second choice, which
      // is the center, at -42˚, so we should get a zero
      chai.expect(temper.getTempVector()).to.have.property('y').equal(-104);
    });
    
    it('Should show disproportionately large numbers when temp is outside goldilocks zone', function() {
      Rob.whichTest = 2;
      var x = -6, y = 7, s = archon.sensor.width / 2;

      var pu = { x: x, y: y - s, t: 1000, e: -(108 - archon.organs.dna.optimalTemp) };
      var pc = { x: x, y: y, t: 500, e: 0 };

      // Spreading this out because as usual, it's making me nuts
      // The basic idea is to make the numbers larger than a simple
      // delta when we're outside our goldilocks zone. This is supposed
      // to be Δt to center + ((50 * Δt to center) / (low end of range Δt to center))
      var d = -192 - archon.organs.dna.optimalTemp;
      var r = archon.organs.dna.optimalTemp - archon.organs.dna.optimalLoTemp;
      var e = d + ((50 * d) / r);        // Should be around -341

      var pd = { x: x, y: y + s, t: -192, e: e };

      archon.sprite.set(pc);

      var temper = new Rob.Temper();
      temper.launch(archon);
      
      chai.expect(temper.getTempVector()).to.have.property('y').within(-370.52, -370.51);
    });
  });
});