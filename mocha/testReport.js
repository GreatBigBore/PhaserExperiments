var chai = require('chai');
var fs = require('fs');
var Rob = require('../Report.js');

var genePool = {
  forEachAlive: function(callback, context) {
    for(var i = 0; i < this.genePool_.length; i++) {
      callback.call(context, this.genePool_[i]);
    }
  },
  
  genePool_: null
};

var genePool_ = [
  { avoidanceFactor: -0.861784016767024, massOfMyBabies: 0.50716979793855, embryoThreshold: 4750.055073942050,
    tasteFactor: 1.421078426348219, lifetime: 21192.44028342968, maxAcceleration: 48.2472750577775,
    maxVelocity: 100.9966779752012, motionMultiplier: 30.81030667498433, optimalMass: 5.3198777687494,
    optimalTemp: 15.54151434310320, sensorSize: 1.034900496671014, smellFactor: 0.808639039106440,
    tempFactor: 1.707621871994588, tempRange: 397.316658675432, velocityFactor: 1.322037755640711,
    color: {r: 0, g: 3, b: 1}, optimalHiTemp: 211.4427665471772, optimalTemp:  -185.8738921282556,
    optimalLoTemp: -200, someFunction() { return 'someFunction'; }
   },

   { avoidanceFactor: -0.872749172963119, massOfMyBabies: 0.528383153584622, embryoThreshold: 4278.72384010006,
     tasteFactor: 1.351306456557066, lifetime: 20505.57317260758, maxAcceleration: 46.4939140312560,
     maxVelocity: 82.7401544122588, motionMultiplier: 27.9759969865240, optimalMass: 3.97646902542655,
     optimalTemp: 12.05145224097395, sensorSize: 1.071031275787366, smellFactor: 0.752840785990595,
     tempFactor: 1.65509176797343, tempRange: 376.531066805803, velocityFactor: 1.204323016099026,
     color: {r: 1, g: 4, b: 8}, optimalHiTemp: 181.9369221747635, optimalTemp:  -194.5941446310401,
     optimalLoTemp: -195
   },
   
   { avoidanceFactor: -0.891209140334782, massOfMyBabies: 0.50638624395492, embryoThreshold: 4536.36191240416,
     tasteFactor: 1.27957747172308, lifetime: 23335.8944613013, maxAcceleration: 43.69793143345262,
     maxVelocity: 93.3842963992884, motionMultiplier: 27.38774043752805, optimalMass: 5.17826159754112,
     optimalTemp: 11.43118862673490, sensorSize: 0.863416248854319, smellFactor: 0.808639039106440,
     tempFactor: 1.652152422206348, tempRange: 370.066758693775, velocityFactor: 1.159669196608217,
     color: {r: 0, g: 5, b: 57}, optimalHiTemp: 192.7452625919609, optimalTemp:  -177.3214961018148,
     optimalLoTemp: -178
   }
]


var acc = [{}, {}, {}];

var setupTestOutput = function(pool, whichAccumulator) {
  for(var i = 0; i < pool.length; i++) {
    var dna = pool[i];
    for(var j in dna) {
      var gene = dna[j];
    
      if(typeof gene !== 'function') {
        if(acc[whichAccumulator][j] === undefined) {
          acc[whichAccumulator][j] = [];
        }
    
        acc[whichAccumulator][j].push(gene);
      }
    }
  }

  for(var j in acc[whichAccumulator]) {
    var geneSummary = acc[whichAccumulator][j];
    
    geneSummary.sort();
  
    var i = null;
    var median = null;
    if(geneSummary.length % 2 === 1) {
      // Odd number of entries
      i = Math.floor(geneSummary.length / 2);
      median = geneSummary[i];
    } else {
      i = geneSummary.length / 2;
    
      median = (geneSummary[i - 1] + geneSummary[i]) / 2;
    }
  }
}

function floatify(value, name) {
  if(isNaN(value)) {
    console.log(value, name);
  }
  return parseFloat(value.toFixed(4));
}

//JSON.parse(fs.readFileSync('genePool.js'));

genePool.genePool_ = genePool_.slice(0);
var report = null;

setupTestOutput(genePool.genePool_, 0);
report = new Rob.Report(genePool);
var reportAsJson = report.reportAsJson();

genePool.genePool_ = genePool_.slice(-1);
setupTestOutput(genePool.genePool_, 1);
report = new Rob.Report(genePool);
var oneReport = report.reportAsJson();

genePool.genePool_ = genePool_.slice(-2);
setupTestOutput(genePool.genePool_, 2);
report = new Rob.Report(genePool);
var twoReport = report.reportAsJson();

describe('Report', function() {
  it('Treat color differently', function() {
    chai.expect(reportAsJson.color).to.not.have.property('average');
  });

  it('Should get averages', function() {
    chai.expect(reportAsJson).to.not.have.property('someFunction');
    chai.expect(floatify(reportAsJson.avoidanceFactor.average)).equal(-0.8752);
    chai.expect(floatify(reportAsJson.massOfMyBabies.average)).equal(0.514);
    chai.expect(floatify(reportAsJson.embryoThreshold.average)).equal(4521.7136);
    chai.expect(floatify(reportAsJson.tasteFactor.average)).equal(1.3507);
    chai.expect(floatify(reportAsJson.lifetime.average)).equal(21677.9693);
    chai.expect(floatify(reportAsJson.maxAcceleration.average)).equal(46.1464);
    chai.expect(floatify(reportAsJson.maxVelocity.average)).equal(92.3737);
    chai.expect(floatify(reportAsJson.motionMultiplier.average)).equal(28.7247);
    chai.expect(floatify(reportAsJson.optimalMass.average)).equal(4.8249);
    chai.expect(floatify(reportAsJson.optimalTemp.average)).equal(-185.9298);
    chai.expect(floatify(reportAsJson.sensorSize.average)).equal(0.9898);
    chai.expect(floatify(reportAsJson.smellFactor.average)).equal(0.79);
    chai.expect(floatify(reportAsJson.tempFactor.average)).equal(1.6716);
    chai.expect(floatify(reportAsJson.tempRange.average)).equal(381.3048);
    chai.expect(floatify(reportAsJson.velocityFactor.average)).equal(1.2287);
    chai.expect(floatify(reportAsJson.optimalHiTemp.average)).equal(195.375);
    chai.expect(floatify(reportAsJson.optimalLoTemp.average)).equal(-191);
    chai.expect(floatify(reportAsJson.color.r.average)).to.equal(0.3333);
    chai.expect(floatify(reportAsJson.color.g.average)).to.equal(4);
    chai.expect(floatify(reportAsJson.color.b.average)).to.equal(22);
  });
  
  it('Should not barf on small gene pool', function() {
    chai.expect(floatify(oneReport.embryoThreshold.median)).to.equal(4536.3619);
    chai.expect(floatify(twoReport.embryoThreshold.median)).to.equal(4407.5429);
    chai.expect(floatify(oneReport.color.r.median)).to.equal(0);
    chai.expect(floatify(oneReport.color.g.median)).to.equal(5);
    chai.expect(floatify(oneReport.color.b.median)).to.equal(57);
    chai.expect(floatify(twoReport.color.r.median)).to.equal(0.5);
    chai.expect(floatify(twoReport.color.g.median)).to.equal(4.5);
    chai.expect(floatify(twoReport.color.b.median)).to.equal(32.5);
  });
  
  it('Should get median', function() {
    chai.expect(floatify(reportAsJson.avoidanceFactor.median)).to.equal(-0.8727);
    chai.expect(floatify(reportAsJson.massOfMyBabies.median)).to.equal(0.5072);
    chai.expect(floatify(reportAsJson.embryoThreshold.median)).to.equal(4536.3619);
    chai.expect(floatify(reportAsJson.tasteFactor.median)).to.equal(1.3513);
    chai.expect(floatify(reportAsJson.lifetime.median)).to.equal(21192.4403);
    chai.expect(floatify(reportAsJson.maxAcceleration.median)).to.equal(46.4939);
    chai.expect(floatify(reportAsJson.maxVelocity.median)).to.equal(93.3843);
    chai.expect(floatify(reportAsJson.motionMultiplier.median)).to.equal(27.976);
    chai.expect(floatify(reportAsJson.optimalMass.median)).to.equal(5.1783);
    chai.expect(floatify(reportAsJson.optimalTemp.median)).to.equal(-185.8739);
    chai.expect(floatify(reportAsJson.sensorSize.median)).to.equal(1.0349);
    chai.expect(floatify(reportAsJson.smellFactor.median)).to.equal(0.8086);
    chai.expect(floatify(reportAsJson.tempFactor.median)).to.equal(1.6551);
    chai.expect(floatify(reportAsJson.tempRange.median)).to.equal(376.5311);
    chai.expect(floatify(reportAsJson.velocityFactor.median)).to.equal(1.2043);
    chai.expect(floatify(reportAsJson.optimalHiTemp.median)).to.equal(192.7453);
    chai.expect(floatify(reportAsJson.optimalLoTemp.median)).to.equal(-195);
    chai.expect(floatify(reportAsJson.color.r.median)).to.equal(0);
    chai.expect(floatify(reportAsJson.color.g.median)).to.equal(4);
    chai.expect(floatify(reportAsJson.color.b.median)).to.equal(8);
  });
});