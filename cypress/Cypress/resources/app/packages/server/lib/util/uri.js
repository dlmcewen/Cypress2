(function() {
  var DEFAULT_PORTS, getPath, removeDefaultPort, stripProtocolAndDefaultPorts, url,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  url = require("url");

  DEFAULT_PORTS = ["443", "80"];

  stripProtocolAndDefaultPorts = function(urlToCheck) {
    var host, hostname, port, ref;
    ref = url.parse(urlToCheck), host = ref.host, hostname = ref.hostname, port = ref.port;
    if (indexOf.call(DEFAULT_PORTS, port) >= 0) {
      return hostname;
    }
    return host;
  };

  removeDefaultPort = function(urlToCheck) {
    var parsed, ref;
    parsed = url.parse(urlToCheck);
    if (ref = parsed.port, indexOf.call(DEFAULT_PORTS, ref) >= 0) {
      parsed.host = null;
      parsed.port = null;
    }
    return url.format(parsed);
  };

  getPath = function(urlToCheck) {
    return url.parse(urlToCheck).path;
  };

  module.exports = {
    getPath: getPath,
    removeDefaultPort: removeDefaultPort,
    stripProtocolAndDefaultPorts: stripProtocolAndDefaultPorts
  };

}).call(this);
