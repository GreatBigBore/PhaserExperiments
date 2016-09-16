/* jshint forin:false, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, loopfunc:true,
	undef:true, unused:true, curly:true, browser:true, indent:false, maxerr:50, jquery:true, node:true */

/* exported robdump, roblog */

"use strict";

var theRobLogObject = null;

function robdump(howMany, key) {
  if(theRobLogObject === null) {
    console.log('No RobLog object for dumping');
  } else {
    theRobLogObject.dump(howMany, key);
  }
}

function roblog(/* arbitrary parameters */) {
  if(theRobLogObject === null) {
    theRobLogObject = new RobLog();
  }

  if(
    arguments[0] === 'target'
  ) {
    theRobLogObject.log.apply(theRobLogObject, arguments);
  }
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

  howMany = Math.min(howMany, this.messages.length);
  var oldestMessageIndex =
    (this.messages.length === this.messagesLimit) ?
    this.indexForNextMessage :
    this.messages.length - howMany;

  for(var i = 0; i < howMany; i++) {
    var indexOfMessageToShow = (i + oldestMessageIndex) % this.messages.length;
    var message = this.messages[indexOfMessageToShow];

    if(key === undefined || message.indexOf(key) > 0) {
      console.log(
        i.toString() + ' (' + indexOfMessageToShow.toString() + ') ' + message
      );
    }
  }
};

RobLog.prototype.log = function(/* arbitrary parameters */) {
  var final = '';
  var separator = '';

  for(var i = 0; i < arguments.length; i++) {
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

  if(this.messages.length < this.messagesLimit) {
    this.messages.push(final);
  } else {
    this.messages[this.indexForNextMessage] = final;
  }

  this.indexForNextMessage = (this.indexForNextMessage + 1) % this.messagesLimit;

  return 'Log report complete';
};
