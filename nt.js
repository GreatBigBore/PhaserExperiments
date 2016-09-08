Rob = {};
var fs = require('fs');
require('./Rob.js');
require('./Range.js');

process.argv.forEach(function(v, i, a) {
  //console.log(i + ': ' + v);
});

if(process.argv.length < 3) {
  console.log('Need module name to test -- "node nt.js <module name>"');
  return;
}

var path = 'testHarnesses/' + process.argv[2];
if(path.substr(-3) !== '.js') {
  path += '.js';
}

var moduleName = process.argv[2].replace('.js', '');

console.log("\n\n\n************************************************************************");
console.log("Running test harness '" + path + "', testing module '" + moduleName + "'");
console.log("************************************************************************\n\n\n");

try {
  fs.accessSync(path, fs.F_OK);
} catch(e) {
  console.log("Can't access file '" + path + "'");
  console.log("\n\n\n************************************************************************");
  return;
}

var victim = require(path).DNA;
console.log(victim);
//victim.test();
