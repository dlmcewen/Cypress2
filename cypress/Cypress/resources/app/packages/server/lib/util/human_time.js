(function() {
  var long, moment, parse, pluralize, short;

  moment = require("moment");

  pluralize = require("pluralize");

  parse = function(ms) {
    var duration, hours, mins;
    mins = 0;
    duration = moment.duration(ms);
    hours = duration.hours();
    mins = hours * 60;
    return {
      mins: mins,
      hours: hours,
      duration: duration
    };
  };

  long = function(ms) {
    var duration, mins, msg, ref, secs, word;
    msg = [];
    ref = parse(ms), mins = ref.mins, duration = ref.duration;
    if (mins += duration.minutes()) {
      word = pluralize("minute", mins);
      msg.push(mins + " " + word);
    }
    secs = duration.seconds();
    word = pluralize("second", secs);
    msg.push(secs + " " + word);
    return msg.join(", ");
  };

  short = function(ms) {
    var duration, millis, mins, msg, ref, secs;
    msg = [];
    ref = parse(ms), mins = ref.mins, duration = ref.duration;
    if (mins += duration.minutes()) {
      msg.push(mins + "m");
    }
    secs = duration.seconds();
    if (secs) {
      msg.push(secs + "s");
    } else {
      if (!mins) {
        millis = duration.milliseconds();
        if (millis) {
          msg.push(millis + "ms");
        } else {
          msg.push(secs + "s");
        }
      }
    }
    return msg.join(", ");
  };

  module.exports = {
    long: long,
    short: short
  };

}).call(this);
