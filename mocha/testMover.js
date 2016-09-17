var chai = require('chai');
var Rob = require('../Mover.js');

Rob.globals = {
  normalZeroCenterRange: new Rob.Range(-0.5, 0.5)
};

var sensorWidth = 50;

var archon = {
  velocity: Rob.XY(19, 69),
  position: Rob.XY(-10, 66),
  sensorWidth: sensorWidth,
  stopped: false,
  
  organs: {
    accel: {
      fromMover: Rob.XY(),
      
      setTarget: function(target) {
        this.fromMover.set(target);
      }
    },
    
    dna: {
      tasteFactor: 1,
      tempFactor: 1,
      targetChangeDelay: 20
    },
    
    locator: {
      senseVector: Rob.XY(),
      foodDistanceRange: new Rob.Range(sensorWidth / 2, 1),
      
      getSenseVector: function(sense) {
        return this.senseVector;
      }
    },
    
    temper: {
      tempRange: new Rob.Range(-400, -200),
      tempVector: Rob.XY(),
      
      getTempVector: function() {
        return this.tempVector;
      }
    },
  }
};

var mover = new Rob.Mover();
mover.init();
mover.ready(archon);

describe('Mover', function() {
  describe('Smoke test', function() {
    archon.organs.temper.tempVector.set(42, -137);
    archon.organs.locator.senseVector.set(-137, -42);
    
    it('Should set target for temp vector', function() {
      archon.tempFactor = 2;
      archon.tasteFactor = 1;
      mover.launch();
      mover.tick(archon.targetChangeDelay + 1);

      var v = Rob.XY(archon.organs.accel.fromMover);

      v.add(archon.velocity.x, 0);
      v.normalize();
      v.scalarMultiply(archon.sensorWidth);
      v.add(archon.position);
      
      chai.expect(archon.organs.accel.fromMover.equals(v).true);
    });
    
    it('Should set target for taste vector', function() {
      archon.tempFactor = 1;
      archon.tasteFactor = 2;
      mover.launch();
      mover.tick(archon.targetChangeDelay + 1);
      
      chai.expect(
        archon.organs.accel.fromMover.equals(archon.organs.locator.senseVector.normalized().timesScalar(archon.sensorWidth))
      ).true;
    });
    
    it('Should delay per dna instructions', function() {
      archon.tempFactor = 1;
      archon.tasteFactor = 2;
      archon.organs.accel.fromMover.reset();
      mover.launch();

      for(var i = 0; i < archon.targetChangeDelay; i++) {
        mover.tick(i);
        chai.expect(
          archon.organs.accel.fromMover.equals(archon.organs.locator.senseVector.normalized().timesScalar(archon.sensorWidth))
        ).false;
      }
      
      var v = Rob.XY(archon.organs.locator.senseVector)
      
      mover.tick(archon.targetChangeDelay + 1);
      chai.expect(
        archon.organs.accel.fromMover.equals(archon.organs.locator.senseVector.normalized().timesScalar(archon.sensorWidth))
      ).true;
    })
  });
});
