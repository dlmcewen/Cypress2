(function() {
  var Promise, addSyncFileSystemWarnings, fs, getStack, promisifiedFs, topLines, warnOnSyncFileSystem;

  fs = require("fs-extra");

  Promise = require("bluebird");

  warnOnSyncFileSystem = function() {
    console.error("WARNING: fs sync methods can fail due to EMFILE errors");
    console.error("Cypress only works reliably when ALL fs calls are async");
    return console.error("You should modify these sync calls to be async");
  };

  topLines = function(from, n, text) {
    return text.split("\n").slice(from, n).join("\n");
  };

  getStack = function() {
    var err;
    err = new Error();
    return topLines(3, 10, err.stack);
  };

  addSyncFileSystemWarnings = function(fs) {
    var oldExistsSync;
    oldExistsSync = fs.existsSync;
    return fs.existsSync = function(filename) {
      warnOnSyncFileSystem();
      console.error(getStack());
      return oldExistsSync(filename);
    };
  };

  addSyncFileSystemWarnings(fs);

  promisifiedFs = Promise.promisifyAll(fs);

  module.exports = promisifiedFs;

}).call(this);
