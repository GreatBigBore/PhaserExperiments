/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* exported robdump, roblog */

"use strict";

var theRobLogObject = null;

function robdump(howMany, key) {
  if(theRobLogObject === null) {
    return 'No RobLog object for dumping';
  } else {
    return theRobLogObject.dump(howMany, key);
  }
}

function roblog(archonUniqueID /* plus arbitrary parameters */) {
  if(theRobLogObject === null) {
    theRobLogObject = new RobLog();
  }

  theRobLogObject.log.apply(theRobLogObject, arguments);
}

function RobLog() {
}

RobLog.prototype.indexForNextMessage = 0;

RobLog.prototype.messagesLimit = 1000;

RobLog.prototype.messages = [];

RobLog.prototype.dump = function(howMany, key) {
  if(this.messages.length === 0) {
    console.log('Empty log');
    return;
  }
  
  var howManyFound = 0;

  howMany = Math.min(howMany, this.messages.length);
  var oldestMessageIndex =
    (this.messages.length === this.messagesLimit) ?
    this.indexForNextMessage :
    this.messages.length - howMany;

  for(var i = 0; i < howMany; i++) {
    var indexOfMessageToShow = (i + oldestMessageIndex) % this.messages.length;
    var message = this.messages[indexOfMessageToShow];
    
    var id = message.id;
    if(id === key) {
      howManyFound++;
      var string = message.string;
      console.log(
        i.toString() + ' (' + indexOfMessageToShow.toString() + '), archon ' + id.toString(), string
      );
    }
  }

  if(howManyFound === 0) {
    return 'No entries found for archon ' + key;
  } else {
    return 'Log report complete; ' + howManyFound + ' entries for archon ' + key;
  }
};

RobLog.prototype.log = function(/* arbitrary parameters */) {
  var final = '';
  var separator = '';

  for(var i = 1; i < arguments.length; i++) {
    var v = arguments[i];

    // It is damned hard in js to determine whether you have a number!
    if(typeof v === "number") {
      if(!isNaN(v)) {
        if(isFinite(v)) {
          v = parseFloat(v).toFixed(2);
        } else {
          v = '<infinity>';
        }
      }
    }

    final += separator + v;
    separator = ', ';
  }
  
  var message = { id: arguments[0], string: final };

  if(this.messages.length < this.messagesLimit) {
    this.messages.push(message);
  } else {
    this.messages[this.indexForNextMessage] = message;
  }

  this.indexForNextMessage = (this.indexForNextMessage + 1) % this.messagesLimit;
};
