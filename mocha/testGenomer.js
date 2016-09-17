var chai = require('chai');
var Rob = require('../Genomer.js');

Rob.preGameInit();  // Has some range stuff in it that DNA needs

var archon1 = {
};

var archon2 = {
};

var assert = require('assert');
describe('Genomer', function() {
  describe('Smoke test', function() {
    it('Should survive construction', function() {
      var g = null;
      chai.expect(g = new Rob.Genomer(archon1)).to.not.throw;
      chai.expect(g).to.have.property('primordialGenome');
      chai.expect(g.primordialGenome).to.have.property('color');
    });
    
    var g = new Rob.Genomer(archon1);
    g.genomifyChildArchon();

    it('Should store a genome', function() { chai.expect(archon1).to.have.property('genome'); });
    
    it('Getters should work in a cool way', function() { chai.expect(typeof g.maxAcceleration).equal('number'); });
  });

  describe('ScalarGene', function() {
    var sg = new Rob.ScalarGene(42), tg = new Rob.ScalarGene(43);
    
    it('Gene should construct properly', function() {
      chai.expect(sg).to.include({value: 42, changeProbability: 10, changeRange: 10});
    });
    
    it('mutateYN() Should return true or false', function() {
      chai.expect(typeof sg.mutateYN()).equal('boolean');
    })
    
    it('mutateScalar() should return a number', function() {
      chai.expect(typeof sg.mutateScalar(42)).equal('number');
    });
    
    it('mutateMutatability() should not botch control values', function() {
      sg.mutateMutatability(tg);
      chai.expect(isNaN(sg.changeProbability)).false;
      chai.expect(isNaN(sg.changeRange)).false;
    });
    
    it('Should inherit with multiply', function() {
      var probability = tg.changeProbability, range = tg.changeRange;
      
      for(var i = 0; i < 100; i++) {
        sg.inherit(tg);
        
        var possibleChangeRange = tg.changeRange + 30;  // Because of the twist in mutateScalar()
        
        chai.expect(sg.changeProbability).within(tg.changeProbability * (1 - possibleChangeRange / 100), tg.changeProbability * (1 + possibleChangeRange / 100));
        chai.expect(sg.changeRange).within(tg.changeRange * (1 - possibleChangeRange / 100), tg.changeRange * (1 + possibleChangeRange / 100));

        chai.expect(sg.value).within(tg.value * (1 - possibleChangeRange / 100), tg.value * (1 + possibleChangeRange / 100));
      }
    });
  });
  
  describe('ColorGene', function() {
    var cg = new Rob.ColorGene(Rob.tinycolor('hsl(180, 50%, 50%)')), dg = new Rob.ColorGene(Rob.tinycolor('hsl(180, 50%, 50%)'));
    
    it('Gene should construct properly', function() {
      chai.expect(cg).to.include({ changeProbability: 10, changeRange: 10 });
      chai.expect(cg).to.have.property('color');
      chai.expect(cg.color.toRgb()).to.include({ r: 64, g: 191, b: 191 });
    });
    
    it('mutateYN() Should return true or false', function() {
      chai.expect(typeof cg.mutateYN()).equal('boolean');
    })
    
    it('mutateMutatability() should not botch control values', function() {
      cg.mutateMutatability(cg);
      chai.expect(isNaN(cg.changeProbability)).false;
      chai.expect(isNaN(cg.changeRange)).false;
    });

    it('Should inherit with add', function() {
      cg.inherit(dg);
      
      var possibleChangeRange = dg.changeRange + 30;  // Because of the twist in mutateScalar()
      
      chai.expect(cg.changeProbability).within(dg.changeProbability * (1 - possibleChangeRange / 100), dg.changeProbability * (1 + possibleChangeRange / 100));
      chai.expect(cg.changeRange).within(dg.changeRange * (1 - possibleChangeRange / 100), dg.changeRange * (1 + possibleChangeRange / 100));

      var t = Rob.tinycolor(cg.color).toHsl();
      chai.expect(t.h).within(0, 360); chai.expect(t.s).within(0, 100); chai.expect(t.l).within(0, 100);
    });
  });
});
