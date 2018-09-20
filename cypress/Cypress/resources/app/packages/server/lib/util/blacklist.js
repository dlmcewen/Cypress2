(function() {
  var _, matches, minimatch, uri;

  _ = require("lodash");

  minimatch = require("minimatch");

  uri = require("./uri");

  matches = function(urlToCheck, blacklistHosts) {
    var matchUrl;
    blacklistHosts = [].concat(blacklistHosts);
    urlToCheck = uri.stripProtocolAndDefaultPorts(urlToCheck);
    matchUrl = function(hostMatcher) {
      return minimatch(urlToCheck, hostMatcher);
    };
    return _.find(blacklistHosts, matchUrl);
  };

  module.exports = {
    matches: matches
  };

}).call(this);
