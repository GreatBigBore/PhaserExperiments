var dna = require('./Rob.js').Rob.DNA;

var assert = require('assert');
describe('DNA', function() {
  describe('#launch()', function() {
    it('Should have set itself up as a strand of DNA', function() {
      assert.equal(42, dna.mutateScalar());
    });
  });
});
