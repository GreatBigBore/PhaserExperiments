var chai = require('chai');
var Rob = require('../Locator.js');

var archon = {
  sensor: { width: 100, x: 300, y: 300 },
  organs: {},
};

var sensees = [ { x: 286, y: 259 }, { x: 267, y: 331 }, { x: 333, y: 283 }, { x: 272, y: 325 }, { x: 284, y: 258 }, { x: 277, y: 271 }, { x:
340, y: 281 }, { x: 333, y: 296 }, { x: 347, y: 292 }, { x: 275, y: 290 }, { x: 271, y: 338 }, { x: 331, y: 255 }, { x: 326,
y: 334 }, { x: 256, y: 255 }, { x: 299, y: 295 }, { x: 299, y: 267 }, { x: 259, y: 256 }, { x: 259, y: 303 }, { x: 338, y: 268
}, { x: 327, y: 329 }, { x: 326, y: 269 }, { x: 271, y: 328 }, { x: 287, y: 279 }, { x: 307, y: 264 }, { x: 265, y: 264 }, {
x: 317, y: 336 }, { x: 267, y: 334 }, { x: 342, y: 345 }, { x: 290, y: 281 }, { x: 263, y: 287 }, { x: 310, y: 279 }, { x:
264, y: 331 }, { x: 307, y: 323 }, { x: 302, y: 337 }, { x: 253, y: 308 }, { x: 336, y: 287 }, { x: 312, y: 335 }, { x: 274,
y: 310 }, { x: 298, y: 265 }, { x: 326, y: 327 }, { x: 271, y: 318 }, { x: 307, y: 292 }, { x: 317, y: 296 }, { x: 297, y: 258
}, { x: 327, y: 348 }, { x: 266, y: 315 }, { x: 279, y: 290 }, { x: 325, y: 267 }, { x: 298, y: 293 }, { x: 340, y: 315 }, {
x: 323, y: 252 }, { x: 271, y: 290 }, { x: 262, y: 336 }, { x: 319, y: 327 }, { x: 288, y: 308 }, { x: 334, y: 270 }, { x:
295, y: 326 }, { x: 260, y: 338 }, { x: 289, y: 250 }, { x: 342, y: 320 }, { x: 324, y: 290 }, { x: 348, y: 336 }, { x: 340,
y: 264 }, { x: 307, y: 253 }, { x: 336, y: 258 }, { x: 312, y: 261 }, { x: 315, y: 341 }, { x: 322, y: 316 }, { x: 311, y: 334
}, { x: 261, y: 299 }, { x: 269, y: 293 }, { x: 349, y: 278 }, { x: 335, y: 261 }, { x: 301, y: 291 }, { x: 332, y: 335 }, {
x: 304, y: 339 }, { x: 251, y: 338 }, { x: 324, y: 256 }, { x: 276, y: 309 }, { x: 302, y: 309 }, { x: 273, y: 281 }, { x:
337, y: 347 }, { x: 257, y: 259 }, { x: 297, y: 256 }, { x: 342, y: 274 }, { x: 295, y: 257 }, { x: 269, y: 296 }, { x: 291,
y: 324 }, { x: 283, y: 255 }, { x: 261, y: 291 }, { x: 327, y: 294 }, { x: 334, y: 276 }, { x: 343, y: 290 }, { x: 260, y: 340
}, { x: 341, y: 301 }, { x: 342, y: 336 }, { x: 329, y: 347 }, { x: 330, y: 339 }, { x: 268, y: 332 }, { x: 267, y: 262 } ]


var tv = Rob.XY();
for(var i = 0; i < sensees.length; i++) {
  var relativePosition = Rob.XY(sensees[i]).minus(archon.sensor.x, archon.sensor.y);
  var distance = relativePosition.getMagnitude();
  var value = 2 - distance / (archon.sensor.width / 2);
  
  tv.add(relativePosition.normalized().timesScalar(value * relativePosition.getSign()));
}

tv.scalarDivide(100);

var locator = new Rob.Locator();
locator.ready(archon);

describe('Locator', function() {
  describe('Test sense:', function() {
    it('Should get the right kind of numbers', function() {
      for(var i = 0; i < sensees.length; i++) {
        locator.sense('taste', sensees[i]);
      }
      
      var v = locator.getSenseVector('taste');
      
      chai.expect(v).to.include({x: tv.x, y: tv.y});
    });
  });
});