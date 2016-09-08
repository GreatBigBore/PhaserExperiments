Rob = {};
require('./Rob.js');
require('./Range.js');

var wcr = Rob.Range(0.0549, 0.9804);
var temp = Rob.Range(-1000, 1000);
var screen = Rob.Range(0, 600);
var brightness = Rob.Range(0.3, 0);

var e10 = Rob.Range(0, 10);
var e100 = Rob.Range(0, 100);
var h10 = Rob.Range(10, 0);
var h100 = Rob.Range(100, 0);
