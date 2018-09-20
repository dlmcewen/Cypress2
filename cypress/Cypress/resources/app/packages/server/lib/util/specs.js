(function() {
  var MINIMATCH_OPTIONS, _, check, debug, find, getPatternRelativeToProjectRoot, glob, la, minimatch, path;

  _ = require("lodash");

  la = require("lazy-ass");

  path = require("path");

  check = require("check-more-types");

  debug = require("debug")("cypress:server:specs");

  minimatch = require("minimatch");

  glob = require("./glob");

  MINIMATCH_OPTIONS = {
    dot: true,
    matchBase: true
  };

  getPatternRelativeToProjectRoot = function(specPattern, projectRoot) {
    return _.map(specPattern, function(p) {
      return path.relative(projectRoot, p);
    });
  };

  find = function(config, specPattern) {
    var doesNotMatchAllIgnoredPatterns, fixturesFolderPath, ignorePatterns, integrationFolderPath, javascriptsPaths, matchesSpecPattern, options, relativePathFromIntegrationFolder, relativePathFromProjectRoot, setNameParts, supportFilePath;
    la(check.maybe.strings(specPattern), "invalid spec pattern", specPattern);
    integrationFolderPath = config.integrationFolder;
    debug("looking for test specs in the folder:", integrationFolderPath);
    if (config.fixturesFolder) {
      fixturesFolderPath = path.join(config.fixturesFolder, "**", "*");
    }
    supportFilePath = config.supportFile || [];
    javascriptsPaths = _.map(config.javascripts, function(js) {
      return path.join(config.projectRoot, js);
    });
    options = {
      sort: true,
      absolute: true,
      cwd: integrationFolderPath,
      ignore: _.compact(_.flatten([javascriptsPaths, supportFilePath, fixturesFolderPath]))
    };
    relativePathFromIntegrationFolder = function(file) {
      return path.relative(integrationFolderPath, file);
    };
    relativePathFromProjectRoot = function(file) {
      return path.relative(config.projectRoot, file);
    };
    setNameParts = function(file) {
      debug("found spec file %s", file);
      if (!path.isAbsolute(file)) {
        throw new Error("Cannot set parts of file from non-absolute path " + file);
      }
      return {
        name: relativePathFromIntegrationFolder(file),
        relative: relativePathFromProjectRoot(file),
        absolute: file
      };
    };
    ignorePatterns = [].concat(config.ignoreTestFiles);
    doesNotMatchAllIgnoredPatterns = function(file) {
      return _.every(ignorePatterns, function(pattern) {
        return !minimatch(file, pattern, MINIMATCH_OPTIONS);
      });
    };
    matchesSpecPattern = function(file) {
      var matchesPattern;
      if (!specPattern) {
        return true;
      }
      matchesPattern = function(pattern) {
        return minimatch(file, pattern, MINIMATCH_OPTIONS);
      };
      return _.chain([]).concat(specPattern).some(matchesPattern).value();
    };
    return glob(config.testFiles, options).filter(doesNotMatchAllIgnoredPatterns).filter(matchesSpecPattern).map(setNameParts).tap(function(files) {
      return debug("found %d spec files: %o", files.length, files);
    });
  };

  module.exports = {
    find: find,
    getPatternRelativeToProjectRoot: getPatternRelativeToProjectRoot
  };

}).call(this);
