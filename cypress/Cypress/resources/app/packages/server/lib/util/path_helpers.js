(function() {
  var Promise, checkIfResolveChangedRootFolder, fs, getRealFolderPath, getRelativePathToSpec, isIntegrationTestRe, isUnitTestRe, path;

  path = require("path");

  Promise = require("bluebird");

  fs = require("./fs");

  isIntegrationTestRe = /^integration/;

  isUnitTestRe = /^unit/;

  checkIfResolveChangedRootFolder = function(resolved, initial) {
    return path.isAbsolute(resolved) && path.isAbsolute(initial) && !resolved.startsWith(initial);
  };

  getRealFolderPath = function(folder) {
    if (!folder) {
      throw new Error("Expected folder");
    }
    return fs.realpathAsync(folder);
  };

  getRelativePathToSpec = function(spec) {
    switch (false) {
      case !isIntegrationTestRe.test(spec):
        return path.relative("integration", spec);
      default:
        return spec;
    }
  };

  module.exports = {
    checkIfResolveChangedRootFolder: checkIfResolveChangedRootFolder,
    getRealFolderPath: getRealFolderPath,
    getRelativePathToSpec: getRelativePathToSpec,
    getAbsolutePathToSpec: function(spec, config) {
      switch (false) {
        case !isIntegrationTestRe.test(spec):
          spec = getRelativePathToSpec(spec);
          return path.join(config.integrationFolder, spec);
        default:
          return spec;
      }
    }
  };

}).call(this);
