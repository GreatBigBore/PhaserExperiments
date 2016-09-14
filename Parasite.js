/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

"use strict";

var Rob = Rob || {};

(function(Rob) {

Rob.Parasite = function() {
};

Rob.Parasite.prototype = {
  init: function() {
    
  },
  
  launch: function() {
    
  },
  
  ready: function(archon) {
    this.archon = archon;
    this.organs = Object.assign({}, archon.organs);
  },
  
  tick: function() {
  }
};

})(Rob);

if(typeof window === "undefined") {
  module.exports = Rob;
}
