/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* exports Bore */

"use strict";

var Bore;

if(typeof window === "undefined") {
  exports.Bore = require('./Bore.js').Bore;
  Bore = exports.Bore;
}

Bore.someOtherGlobals = { something: 1, somethingElse: 2 };

Bore.OtherStuff = function() { this.prop1 = 1; this.prop2 = 2; };

Bore.OtherStuff.prototype.sixTimesNine = function() { return 42; };

if(typeof window === "undefined") {
  exports.Bore.OtherStuff = Bore.OtherStuff;
}
