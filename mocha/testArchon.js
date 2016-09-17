var chai = require('chai');
var Rob = require('../Archon.js');
var sprite = require('../PhaserMockups/sprite.js');
var button = require('../PhaserMockups/sprite.js');
var sensor = require('../PhaserMockups/sprite.js');

describe('Archon', function() {
  describe('Constructor', function() {
    it('Should construct properly', function() {
      var archon1 = null;
      
      chai.expect(
        archon1 = new Rob.Archon(sprite, button, sensor)
      ).to.deep.include({ sprite: sprite, button: button, sensor: sensor });

      chai.expect(archon1).to.have.property('organs');
      chai.expect(archon1.organs).to.have.property('genomer');
    });
  });
  
  describe('Inheritance', function() {
    var archon1 = new Rob.Archon(sprite, button, sensor)
    archon1.organs = { genomer: new Rob.Genomer(archon1) };
    archon1.organs.genomer.genomifyChildArchon();
    
    it('Should have a recognizable genome', function() {
      chai.expect(archon1).to.have.property('genome');

      // Will have much more, but this sample should suffice to tell us it's working
      chai.expect(archon1.genome).to.have.property('embryoThresholdMultiplier');
      chai.expect(archon1.genome).to.have.property('hungerMultiplier');
      chai.expect(archon1.genome).to.have.property('maxAcceleration');
      chai.expect(archon1.genome).to.have.property('maxVelocityMagnitude');
      chai.expect(archon1.genome).to.have.property('optimalMass');
    });
    
    it('Should return the right values', function() {
      var aRange = archon1.genome.maxAcceleration.changeRange + 30;
      var aRangeLo = archon1.organs.genomer.primordialGenome.maxAcceleration.value * (1 - aRange / 100);
      var aRangeHi = archon1.organs.genomer.primordialGenome.maxAcceleration.value * (1 + aRange / 100);

      var vRange = archon1.genome.maxAcceleration.changeRange + 30;
      var vRangeLo = archon1.organs.genomer.primordialGenome.maxVelocityMagnitude.value * (1 - vRange / 100);
      var vRangeHi = archon1.organs.genomer.primordialGenome.maxVelocityMagnitude.value * (1 + vRange / 100);

      chai.expect(archon1.genome.maxAcceleration.get()).within(aRangeLo, aRangeHi);
      chai.expect(archon1.genome.maxVelocityMagnitude.get()).within(vRangeLo, vRangeHi);
    })
  });
});