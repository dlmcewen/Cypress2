(function() {
  var ready, scale;

  scale = function() {
    var app;
    try {
      app = require("electron").app;
      return app.commandLine.appendSwitch("force-device-scale-factor", "1");
    } catch (error) {}
  };

  ready = function() {
    var Promise, app, waitForReady;
    Promise = require("bluebird");
    app = require("electron").app;
    waitForReady = function() {
      return new Promise(function(resolve, reject) {
        return app.on("ready", resolve);
      });
    };
    return Promise.any([waitForReady(), Promise.delay(500)]);
  };

  module.exports = {
    scale: scale,
    ready: ready
  };

}).call(this);
