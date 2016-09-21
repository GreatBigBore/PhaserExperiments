/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

"use strict";

var Rob = Rob || {};

(function(Rob) {

Rob.FamilyTree = function() {
  this.everyone = {
    'god': { parentId: 'none', myChildren: [] }
  };
};

Rob.FamilyTree.prototype = {
  addMe: function(myId, idOfMyParent) {
    if(!this.everyone.hasOwnProperty(idOfMyParent)) {
      throw new ReferenceError("Can't add this child because we don't recognize the parent");
    }
    
    if(this.everyone.hasOwnProperty(myId)) {
      throw new ReferenceError("Can't add this child because it's already there");
    }

    // Add me to the roster of everyone who ever lived
    this.everyone[myId] = { myId: myId, parentId: idOfMyParent, myChildren: [] };
    
    // Add me to my parent's list of children
    this.everyone[idOfMyParent].myChildren.push(myId);
  },
  
  getDegreeOfRelatedness: function(lhs, rhs) {
    var currentId = this.everyone[lhs].parentId;
    var myAncestry = [];

    do {
      myAncestry.push(currentId); // Our array will be in order from most recent to most ancient
      currentId = this.everyone[currentId].parentId;
    } while(currentId !== 'none');
    
    var generationCount = 0;
    var indexInMyAncestry = 0;
    currentId = rhs;
    do {
      var index = myAncestry.indexOf(currentId);
      if(index === -1) {
        generationCount++;
        currentId = this.everyone[currentId].parentId;
      } else {
        indexInMyAncestry = index;
        break;
      }
    } while(currentId !== 'none');
    
    return generationCount +  indexInMyAncestry;
  }
};
  
})(Rob);
