var o = require('./otherStuff.js').Bore.OtherStuff;

var assert = require('assert');
describe('DNA', function() {
  describe('#launch()', function() {
    it('Should have set itself up as a strand of DNA', function() {
      assert.equal(42, o.hello());
    });
  });
});
