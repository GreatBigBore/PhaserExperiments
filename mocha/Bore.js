/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

"use strict";

var Bore = {
  someGlobalData: { foo: 1, bar: 2 },
  aGlobalFunction: function() { console.log('Global Function'); }
};

Bore.another = function() {
  console.log("another");
};

if(typeof window === "undefined") {
  exports.Bore = Bore;
}
