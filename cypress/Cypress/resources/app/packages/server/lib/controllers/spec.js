(function() {
  var Promise, errors, log, preprocessor;

  log = require("debug")("cypress:server:controllers:spec");

  Promise = require("bluebird");

  errors = require("../errors");

  preprocessor = require("../plugins/preprocessor");

  module.exports = {
    handle: function(spec, req, res, config, next, project) {
      log("request for", spec);
      res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      });
      res.type("js");
      return preprocessor.getFile(spec, config).then(function(filePath) {
        var sendFile;
        log("send " + filePath);
        sendFile = Promise.promisify(res.sendFile.bind(res));
        return sendFile(filePath);
      })["catch"]({
        code: "ECONNABORTED"
      }, function(err) {})["catch"](function(err) {
        var filePath, os, ref;
        if (config.isTextTerminal) {
          if (os = err.originalStack) {
            err.stack = os;
          }
          filePath = (ref = err.filePath) != null ? ref : spec;
          err = errors.get("BUNDLE_ERROR", filePath, preprocessor.errorMessage(err));
          console.log("");
          errors.log(err);
          return project.emit("exitEarlyWithErr", err.message);
        } else {
          return res.send(preprocessor.clientSideError(err));
        }
      });
    }
  };

}).call(this);
