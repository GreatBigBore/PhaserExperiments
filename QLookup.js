/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

"use strict";

var Rob = Rob || {};

if(typeof window === "undefined") {
}

(function(Rob) {

Rob.QLookup = function() {
  this.qLookup_ = {};

  this.qLookup = new Proxy(this.qLookup_, {
    get: function(target, name) {
      if(name in target) {
        return target[name];
      } else {
        return this.getTarget(name);
      }
    },
    
    set: function(target, name, value) {
      if(name in target) {
        target[name] = value;
      } else {
        debugger;
      }
    }
  });
};

Rob.QLookup.prototype = {
  moduleNames: {
    'Accel', 'Archon', 'Archons', 'Bitmap', 'FamilyTree', 'Genomer', 'Lizer', 'Locator',
    'MannaGarden', 'MannaGenerator', 'Mover', 'Spreader', 'Sun', 'Temper'
  },
  
  findProperty: function(module, name) {
    if(module[name] === undefined) {
      return null;
    } else {
      return module[name];
    }
  },
  
  findTarget: function(name) {
    if(this.targets[name] === undefined) {
      for(var i in this.moduleNames) {
        var moduleName = moduleNames[i];
        
        if(this.modules[moduleName] === undefined) {
          var module = this.modules[moduleName];
          var property = this.findProperty(module, name);
          
          if(property === null) {
            continue;
          } else {
            this[name] = module[property];
            return this.targets[name];
          }
        } else {
          
        }
      }
    } else {
      return this.targets[name];
    }
  },
  
  getTarget: function(target, name) {
    this.target = this.findTarget(name);
  }
};

})(Rob);

if(typeof window === "undefined") {
  module.exports = Rob.QLookup;
}
