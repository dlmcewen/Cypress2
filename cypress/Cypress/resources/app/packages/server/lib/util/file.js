(function() {
  var DEBOUNCE_LIMIT, File, LOCK_TIMEOUT, Promise, Queue, _, debug, env, exit, fs, lockFile, md5, os, path,
    slice = [].slice;

  _ = require("lodash");

  os = require("os");

  md5 = require("md5");

  path = require("path");

  debug = require('debug')('cypress:server:file');

  Queue = require("p-queue");

  Promise = require("bluebird");

  lockFile = Promise.promisifyAll(require("lockfile"));

  fs = require("./fs");

  env = require("./env");

  exit = require("./exit");

  DEBOUNCE_LIMIT = 1000;

  LOCK_TIMEOUT = 2000;

  File = (function() {
    function File(options) {
      if (options == null) {
        options = {};
      }
      if (!options.path) {
        throw new Error("Must specify path to file when creating new FileUtil()");
      }
      this.path = options.path;
      this._lockFileDir = path.join(os.tmpdir(), "cypress");
      this._lockFilePath = path.join(this._lockFileDir, (md5(this.path)) + ".lock");
      this._queue = new Queue({
        concurrency: 1
      });
      this._cache = {};
      this._lastRead = 0;
      exit.ensure((function(_this) {
        return function() {
          return lockFile.unlockSync(_this._lockFilePath);
        };
      })(this));
    }

    File.prototype.transaction = function(fn) {
      debug("transaction for %s", this.path);
      return this._addToQueue((function(_this) {
        return function() {
          return fn({
            get: _this._get.bind(_this, true),
            set: _this._set.bind(_this, true)
          });
        };
      })(this));
    };

    File.prototype.get = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      debug("get values from %s", this.path);
      return this._get.apply(this, [false].concat(slice.call(args)));
    };

    File.prototype.set = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      debug("set values in %s", this.path);
      return this._set.apply(this, [false].concat(slice.call(args)));
    };

    File.prototype.remove = function() {
      debug("remove %s", this.path);
      this._cache = {};
      return this._lock().then((function(_this) {
        return function() {
          return fs.removeAsync(_this.path);
        };
      })(this))["finally"]((function(_this) {
        return function() {
          debug("remove succeeded or failed for %s", _this.path);
          return _this._unlock();
        };
      })(this));
    };

    File.prototype._get = function(inTransaction, key, defaultValue) {
      var get;
      get = inTransaction ? this._getContents() : this._addToQueue((function(_this) {
        return function() {
          return _this._getContents();
        };
      })(this));
      return get.then(function(contents) {
        var value;
        if (key == null) {
          return contents;
        }
        value = _.get(contents, key);
        if (value === void 0) {
          return defaultValue;
        } else {
          return value;
        }
      });
    };

    File.prototype._getContents = function(inTransaction) {
      if (Date.now() - this._lastRead > DEBOUNCE_LIMIT) {
        this._lastRead = Date.now();
        return this._read().then((function(_this) {
          return function(contents) {
            return _this._cache = contents;
          };
        })(this));
      } else {
        return Promise.resolve(this._cache);
      }
    };

    File.prototype._read = function() {
      return this._lock().then((function(_this) {
        return function() {
          debug('read %s', _this.path);
          return fs.readJsonAsync(_this.path, "utf8");
        };
      })(this))["catch"]((function(_this) {
        return function(err) {
          if (err.code === "ENOENT" || err.code === "EEXIST" || err.name === "SyntaxError") {
            return {};
          } else {
            throw err;
          }
        };
      })(this))["finally"]((function(_this) {
        return function() {
          debug("read succeeded or failed for %s", _this.path);
          return _this._unlock();
        };
      })(this));
    };

    File.prototype._set = function(inTransaction, key, value) {
      var tmp, type, valueObject;
      if (!_.isString(key) && !_.isPlainObject(key)) {
        type = _.isArray(key) ? "array" : typeof key;
        throw new TypeError("Expected `key` to be of type `string` or `object`, got `" + type + "`");
      }
      valueObject = _.isString(key) ? (tmp = {}, tmp[key] = value, tmp) : key;
      if (inTransaction) {
        return this._setContents(valueObject);
      } else {
        return this._addToQueue((function(_this) {
          return function() {
            return _this._setContents(valueObject);
          };
        })(this));
      }
    };

    File.prototype._setContents = function(valueObject) {
      return this._getContents().then((function(_this) {
        return function(contents) {
          _.each(valueObject, function(value, key) {
            return _.set(contents, key, value);
          });
          _this._cache = contents;
          return _this._write();
        };
      })(this));
    };

    File.prototype._addToQueue = function(operation) {
      return Promise["try"]((function(_this) {
        return function() {
          return _this._queue.add(operation);
        };
      })(this));
    };

    File.prototype._write = function() {
      return this._lock().then((function(_this) {
        return function() {
          debug('write %s', _this.path);
          return fs.outputJsonAsync(_this.path, _this._cache, {
            spaces: 2
          });
        };
      })(this))["finally"]((function(_this) {
        return function() {
          debug("write succeeded or failed for %s", _this.path);
          return _this._unlock();
        };
      })(this));
    };

    File.prototype._lock = function() {
      debug("attempt to get lock on %s", this.path);
      return fs.ensureDirAsync(this._lockFileDir).then((function(_this) {
        return function() {
          return lockFile.lockAsync(_this._lockFilePath, {
            wait: LOCK_TIMEOUT
          });
        };
      })(this))["finally"]((function(_this) {
        return function() {
          return debug("gettin lock succeeded or failed for %s", _this.path);
        };
      })(this));
    };

    File.prototype._unlock = function() {
      debug("attempt to unlock %s", this.path);
      return lockFile.unlockAsync(this._lockFilePath).timeout(env.get("FILE_UNLOCK_TIMEOUT") || LOCK_TIMEOUT)["catch"](Promise.TimeoutError, function() {})["finally"]((function(_this) {
        return function() {
          return debug("unlock succeeded or failed for %s", _this.path);
        };
      })(this));
    };

    return File;

  })();

  File.noopFile = {
    get: function() {
      return Promise.resolve({});
    },
    set: function() {
      return Promise.resolve();
    },
    transaction: function() {},
    remove: function() {
      return Promise.resolve();
    }
  };

  module.exports = File;

}).call(this);
