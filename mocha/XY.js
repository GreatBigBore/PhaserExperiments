//var data_driven = require('data-driven');
var Rob = require('../XY.js');
var chai = require('chai');

describe('XY', function() {
  describe('Test constructor:', function() {
    function makeBadXY() { Rob.XY('zero'); }
    function xyFromUndefined() { return Rob.XY(); }
    function xyFromScalar() { return Rob.XY(42); }
    function xyFromPair() { return Rob.XY(69, 96); }
    function xyFromXY() { return Rob.XY({ x: 137, y: 3.14 }); }
    function xyFromPolar(r, theta) { return Rob.XY.fromPolar(r, theta); }
    
    it('Should throw TypeError', function() {
      chai.expect(makeBadXY).to.throw(TypeError, 'Bad arg');
    });
    
    it('Should not throw', function() {
      chai.expect(xyFromUndefined).to.not.throw();
      chai.expect(xyFromScalar).to.not.throw();
      chai.expect(xyFromPair).to.not.throw();
      chai.expect(xyFromXY).to.not.throw();
      chai.expect(xyFromPolar).to.not.throw();
    });
    
    it('Should accept undefined', function() { chai.expect(xyFromUndefined()).to.include({ x: 0, y: 0 }); } );
    it('Should accept scalar', function() { chai.expect(xyFromScalar()).to.include({ x: 42, y: 42 }); } );
    it('Should accept pair', function() { chai.expect(xyFromPair()).to.include({ x: 69, y: 96 }); } );
    it('Should accept any x/y object', function() { chai.expect(xyFromXY()).to.include({ x: 137, y: 3.14 }); } );
    it('Should accept polar coordinates', function() {
      
      var r = 17;
      var theta = Math.PI / 4;
      var lo = r / Math.sqrt(2) - 1e-5;
      var hi = r / Math.sqrt(2) + 1e-5;
      var p = Rob.XY.fromPolar(r, theta);
      
      chai.expect(p).to.have.property('x').that.is.within(lo, hi);
      chai.expect(p).to.have.property('y').that.is.within(lo, hi);
    });
  });
  
  describe('Test add, subtract, scalar multiply, scalar divide:', function() {
    var p = Rob.XY();
    
    it('Should add', function() { p.reset(); p.add(137, Math.PI); chai.expect(p).to.include({ x: 137, y: Math.PI }); });
    it('Should add implied vector', function() { p.reset(); p.add(42); chai.expect(p).to.include({ x: 42, y: 42 }); });
    
    it('Should subtract', function() { p.reset(); p.subtract(137, Math.PI); chai.expect(p).to.include({ x: -137, y: -Math.PI }); });
    it('Should subtract implied vector', function() { p.reset(); p.subtract(42); chai.expect(p).to.include({ x: -42, y: -42 }); });

    it('Should multiply', function() { p.set(5, 7); p.scalarMultiply(3); chai.expect(p).to.include({ x: 15, y: 21 }); });
    it('Should divide', function() { p.set(37, 20); p.scalarDivide(2); chai.expect(p).to.include({ x: 18.5, y: 10 }); });
  });
  
  describe('Test plus, minus, times scalar, divided by scalar:', function() {
    var p1 = Rob.XY(-17, 19), p2 = Rob.XY(137, -46);
    
    it('Should plus', function() { chai.expect(p1.plus(p2)).to.include({ x: -17 + 137, y: 19 + -46 }); });
    it('Should plus implied vector', function() { chai.expect(p1.plus(3)).to.include({ x: -14, y: 22 }); });

    it('Should minus', function() { chai.expect(p2.minus(p1)).to.include({ x: 137 - (-17), y: -46 - 19 }); });
    it('Should minus implied vector', function() { chai.expect(p2.minus(3)).to.include({ x: 134, y: -49 }); });

    it('Should times scalar', function() { chai.expect(p1.timesScalar(2)).to.include({ x: -34, y: 38 }); });
    it('Should divided by scalar', function() { chai.expect(p2.dividedByScalar(2)).to.include({ x: 137 / 2, y: -23 }); });
  });
  
  describe('Test geometry:', function() {
    var angleFromP0ToP1 = Math.PI / 4, p1Radius = 19;
    var angleFromP0ToP2 = 5 * Math.PI / 3, p2Radius = 32;
    
    var theta2 = angleFromP0ToP1, r2 = p1Radius;
    var theta1 = angleFromP0ToP2, r1 = p2Radius;
    
    // From the answer on my math.stackexchange question at http://tinyurl.com/j8d7ov5
    // d^2 = r1^2 + r2^2 - (2 * r1 * r2 * cos(θ2 - θ1));
    var distanceFromP1ToP2 = Math.sqrt(
      Math.pow(r1, 2) +  Math.pow(r2, 2) - (2 * r1 * r2 * Math.cos(theta2 - theta1))
    );

    // sin(α) / r2 = sin(θ2 - θ1) / d
    // so
    // sin(α) = r2 * sin(θ2 - θ1) / d
    // so
    // α = asin(r2 * sin(θ2 - θ1) / d)
    var alpha = (
      Math.asin(r2 * Math.sin(theta2 - theta1) / distanceFromP1ToP2)
    );
    
    var angleFromP1ToP2 = theta1 - alpha;
    while(angleFromP1ToP2 > Math.PI) { angleFromP1ToP2 -= 2 * Math.PI; }
    while(angleFromP1ToP2 < -Math.PI) { angleFromP1ToP2 += 2 * Math.PI; }
    
    var oppositeAngle = function(theta) {
      theta += Math.PI;
      
      while(theta > Math.PI) { theta -= 2 * Math.PI; }
      while(theta < -Math.PI) { theta += 2 * Math.PI; }
      
      return theta;
    };
    
    var angleFromP1ToP0 = oppositeAngle(angleFromP0ToP1), p1p0lo = angleFromP1ToP0 * (1 + 1e-5), p1p0hi = angleFromP1ToP0 * (1 - 1e-5);
    var angleFromP2ToP0 = oppositeAngle(angleFromP0ToP2), p2p0lo = angleFromP2ToP0 * (1 - 1e-5), p2p0hi = angleFromP2ToP0 * (1 + 1e-5);
    var angleFromP2ToP1 = oppositeAngle(angleFromP1ToP2), p2p1lo = angleFromP2ToP1 * (1 - 1e-5), p2p1hi = angleFromP2ToP1 * (1 + 1e-5);
    
    var p0 = Rob.XY(), p1 = Rob.XY.fromPolar(p1Radius, angleFromP0ToP1), p2 = Rob.XY.fromPolar(p2Radius, angleFromP0ToP2);
    
    it('Angle from origin to p1', function() { chai.expect(p1.getAngleFrom(p0)).to.equal(angleFromP0ToP1); });
    it('Angle to origin from p2', function() { chai.expect(p2.getAngleTo(p0)).to.be.within(p2p0lo, p2p0hi); });

    it('Angle to origin from p1', function() { chai.expect(p1.getAngleTo(p0)).to.be.within(p1p0lo, p1p0hi); });
    it('Angle to p1 from p2', function() { chai.expect(p2.getAngleTo(p1)).to.be.within(p2p1lo, p2p1hi); });

    it('Angle from p1 to p2', function() { chai.expect(p2.getAngleFrom(p1)).to.equal(angleFromP1ToP2); });
    it('Angle from p2 to p1', function() { chai.expect(p1.getAngleFrom(p2)).to.be.within(p2p1lo, p2p1hi); });
    
    it('Distance from origin to p1', function() { chai.expect(p0.getDistanceTo(p1)).to.equal(19); });
    it('Distance from p1 to origin', function() { chai.expect(p1.getDistanceTo(p0)).to.equal(19); });
    it('Distance from origin to p2', function() { chai.expect(p0.getDistanceTo(p2)).to.equal(32); });
    it('Distance from p2 to origin', function() { chai.expect(p2.getDistanceTo(p0)).to.equal(32); });
    it('Distance from p1 to p2', function() { chai.expect(p1.getDistanceTo(p2)).to.be.within(41.22, 41.23); });
    it('Distance from p2 to p1', function() { chai.expect(p2.getDistanceTo(p1)).to.be.within(41.22, 41.23); });
    
    it('Magnitude of zero vector', function() { chai.expect(p0.getMagnitude()).to.equal(0); });
    it('Magnitude of p1', function() { chai.expect(p1.getMagnitude()).to.equal(19); });
    it('Magnitude of p2', function() { chai.expect(p2.getMagnitude()).to.equal(32); });
  });
});
