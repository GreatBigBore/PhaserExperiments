var chai = require('chai');
var Rob = require('../Archon.js');

var sprite = { x: 42, y: 137 };
var button = { x: 13, y: 66 };
var sensor = { x: 98, y: 19 };

var archon = new Rob.Archon(sprite, button, sensor);

describe('Archon', function() {
  describe('Constructor', function() {
    it('Should have archon constructor', function() {
      chai.expect(archon).to.deep.include({ sprite: sprite, button: button, sensor: sensor });
    });
    
    it('Should inherit from XY', function() { chai.expect(archon instanceof Rob.XY).to.be.true; });
  });
  
  describe('Operations', function() {
    it('Should set the sprite\'s internal x/y', function() { archon.set(19, 69); chai.expect(archon.equals(19, 69)).to.be.true; });
  });
});