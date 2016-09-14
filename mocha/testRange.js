var Range = require('../Range.js').Range;
var data_driven = require('data-driven');
var chai = require('chai');

var zeroToOne = new Range(0, 1);
var centeredZeroToOne = new Range(-0.5, 0.5);
var temperatureRange = new Range(-1000, 1000);
var foodDistanceRange = new Range(50, 0);
var speedRange = new Range(-30, 30);
var e10 = new Range(0, 10);
var h10 = new Range(10, 0);

var tests = [
  {
    dest: { range: zeroToOne, name: 'zeroToOne' },
    source: { range: speedRange, name: 'speedRange' },
    testValues: [
      { in: -30, out: 0 }, { in: 30, out: 1 }, { in: 0, out: 0.5 },
      { in: -15, out: 0.25 }, { in: 15, out: 0.75 }, { in: -60, out: -0.5 },
      { in: 60, out: 1.5 }, { in: 90, out: 2 }
    ]
  },

  {
    dest: { range: zeroToOne, name: 'zeroToOne' },
    source: { range: temperatureRange, name: 'temperatureRange' },
    testValues: [
      { in: -1000, out: 0 }, { in: 0, out: 0.5 }, { in: 1000, out: 1},
      { in: -500, out: 0.25 }, { in: 500, out: 0.75 }, { in: -750, out: 0.125 },
      { in: 750, out: 0.875 }, { in: -1100, out: -0.05 }, { in: 1100, out: 1.05 }
    ]
  },

  {
    dest: { range: zeroToOne, name: 'zeroToOne' },
    source: { range: centeredZeroToOne, name: 'centeredZeroToOne' },
    testValues: [
      { in: -0.5, out: 0 }, { in: 0, out: 0.5 }, { in: 0.5, out: 1},
      { in: -0.3, out: 0.2 }, { in: 0.3, out: 0.8 }, { in: -0.6, out: -0.1 },
      { in: 0.6, out: 1.1 }
    ]
  },

  {
    dest: { range: zeroToOne, name: 'zeroToOne' },
    source: { range: e10, name: 'e10' },
    testValues: [
      { in: -5, out: -0.5 }, { in: -1, out: -0.1 }, { in: 0, out: 0 },
      { in: 2.5, out: 0.25 }, { in: 5, out: 0.5 }, { in: 7.5, out: 0.75 },
      { in: 10, out: 1 }, { in: 11, out: 1.1 }, { in: 29, out: 2.9 }
    ]
  },

  {
    dest: { range: zeroToOne, name: 'zeroToOne' },
    source: { range: h10, name: 'h10' },
    testValues: [
      { in: -5, out: 1.5 }, { in: -1, out: 1.1 }, { in: 0, out: 1 },
      { in: 2.5, out: 0.75 }, { in: 5, out: 0.5 }, { in: 7.5, out: 0.25 },
      { in: 1, out: 0.9 }, { in: 11, out: -0.1 }, { in: 29, out: -1.9 }
    ]
  },

  {
    dest: { range: e10, name: 'e10' },
    source: { range: h10, name: 'h10' },
    testValues: [
      { in: -5, out: 15 }, { in: -1, out: 11 }, { in: 0, out: 10 },
      { in: 1, out: 9 }, { in: 2.5, out: 7.5}, { in: 5, out: 5 },
      { in: -19, out: 29 }
    ]
  },

  {
    dest: { range: h10, name: 'h10' },
    source: { range: centeredZeroToOne, name: 'centeredZeroToOne' },
    testValues: [
      { in: 0, out: 5 }, { in: -0.5, out: 10 }, { in: 0.5, out: 0 },
      { in: 0.25, out: 2.5 }, { in: -0.25, out: 7.5 }
    ]
  },

  {
    dest: { range: foodDistanceRange, name: 'foodDistanceRange' },
    source: { range: temperatureRange, name: 'temperatureRange' },
    testValues: [
      { in: -1000, out: 50 }, { in: 0, out: 25 }, { in: 1000, out: 0 },
      { in: -500, out: 37.5 }, { in: 500, out: 12.5 }
    ]
  }
];

var getLoHi = function(value) {
  var lo = value * (1 - 1e-5);
  var hi = value * (1 + 1e-5);

  if(value > 0) { return { lo: lo, hi: hi }; }
  else if(value < 0) { return { lo: hi, hi: lo }; }
  else { return { lo: -1e-5, hi: 1e-5 }; }
};

describe('Range', function() {
  data_driven(tests, function() {
    it('Test single pair of converters', function(singleTest) {
      var description = (
        "Test " +
          singleTest.dest.name + "(" +
          singleTest.dest.range.lo + ", " +
          singleTest.dest.range.hi + ")" +
        " against " +
          singleTest.source.name + "(" +
          singleTest.source.range.lo + ", " +
          singleTest.source.range.hi + ")"
      );

      describe(description, function() {
        var dest = singleTest.dest.range;
        var source = singleTest.source.range;

        data_driven(singleTest.testValues, function() {
          var descriptionForward = (
            ": point {in} on " + singleTest.source.name +
            " should be {out} on " + singleTest.dest.name
          );

          var descriptionBackward = (
            ": point {out} on " + singleTest.dest.name +
            " should be {in} on " + singleTest.source.name
          );

          it(descriptionForward, function(testValues) {
            var lohi = getLoHi(testValues.out);

            chai.expect(dest.convertPoint(testValues.in, source)).
              to.be.within(lohi.lo, lohi.hi);
          });

          it(descriptionBackward, function(testValues) {
            var lohi = getLoHi(testValues.in);

            chai.expect(source.convertPoint(testValues.out, dest)).
              to.be.within(lohi.lo, lohi.hi);
          });
        });
      })
    });
  });
});
