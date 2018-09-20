(function() {
  var JSONOrCoerce, _, coerce, commasToPipes, config, cwd, debug, everythingAfterFirstEqualRe, hasStrayEndQuote, minimist, nestedArraysInSquareBracketsRe, nestedObjectsInCurlyBracesRe, normalizeBackslash, normalizeBackslashes, path, pipesToCommas, removeLastCharacter, sanitizeAndConvertNestedArgs, strToArray, stringify, tryJSONParse, whitelist;

  _ = require("lodash");

  path = require("path");

  debug = require("debug")("cypress:server:args");

  minimist = require("minimist");

  coerce = require("./coerce");

  config = require("../config");

  cwd = require("../cwd");

  nestedObjectsInCurlyBracesRe = /\{(.+?)\}/g;

  nestedArraysInSquareBracketsRe = /\[(.+?)\]/g;

  everythingAfterFirstEqualRe = /=(.+)/;

  whitelist = "cwd appPath execPath apiKey smokeTest getKey generateKey runProject project spec reporter reporterOptions port env ci record updating ping key logs clearLogs returnPkg version mode headed config exit exitWithCode browser runMode outputPath parallel parallelId".split(" ");

  hasStrayEndQuote = function(s) {
    var quoteAt;
    quoteAt = s.indexOf('"');
    return quoteAt === s.length - 1;
  };

  removeLastCharacter = function(s) {
    return s.substr(0, s.length - 1);
  };

  normalizeBackslash = function(s) {
    if (hasStrayEndQuote(s)) {
      return removeLastCharacter(s);
    } else {
      return s;
    }
  };

  normalizeBackslashes = function(options) {
    var pathProperties;
    pathProperties = ["runProject", "project", "appPath", "execPath"];
    pathProperties.forEach(function(property) {
      if (options[property]) {
        return options[property] = normalizeBackslash(options[property]);
      }
    });
    return options;
  };

  stringify = function(val) {
    if (_.isObject(val)) {
      return JSON.stringify(val);
    }
    return val;
  };

  strToArray = function(str) {
    var parsed;
    if (parsed = tryJSONParse(str)) {
      return parsed;
    }
    return [].concat(str.split(","));
  };

  commasToPipes = function(match, p1, p2, p3) {
    return match.split(",").join("|");
  };

  pipesToCommas = function(str) {
    return str.split("|").join(",");
  };

  tryJSONParse = function(str) {
    var err;
    try {
      return JSON.parse(str);
    } catch (error) {
      err = error;
      return null;
    }
  };

  JSONOrCoerce = function(str) {
    var parsed;
    if (parsed = tryJSONParse(str)) {
      return parsed;
    }
    str = pipesToCommas(str);
    if (parsed = tryJSONParse(str)) {
      return parsed;
    }
    return coerce(str);
  };

  sanitizeAndConvertNestedArgs = function(str) {
    var parsed;
    if (parsed = tryJSONParse(str)) {
      return parsed;
    }
    return _.chain(str).replace(nestedObjectsInCurlyBracesRe, commasToPipes).replace(nestedArraysInSquareBracketsRe, commasToPipes).split(",").map(function(pair) {
      return pair.split(everythingAfterFirstEqualRe);
    }).fromPairs().mapValues(JSONOrCoerce).value();
  };

  module.exports = {
    toObject: function(argv) {
      var alias, c, configKeys, configValues, envs, op, options, p, ref, resolvePath, ro, spec, whitelisted;
      debug("argv array: %o", argv);
      alias = {
        "app-path": "appPath",
        "exec-path": "execPath",
        "api-key": "apiKey",
        "smoke-test": "smokeTest",
        "get-key": "getKey",
        "new-key": "generateKey",
        "clear-logs": "clearLogs",
        "run-project": "runProject",
        "return-pkg": "returnPkg",
        "run-mode": "isTextTerminal",
        "exit-with-code": "exitWithCode",
        "reporter-options": "reporterOptions",
        "output-path": "outputPath"
      };
      options = minimist(argv, {
        alias: alias
      });
      whitelisted = _.pick(argv, whitelist);
      options = _.chain(options).defaults(whitelisted).omit(_.keys(alias)).defaults({
        cwd: process.cwd()
      }).mapValues(coerce).value();
      debug("argv parsed: %o", options);
      if (options.updating && !options.appPath) {
        ref = options._.slice(-2), options.appPath = ref[0], options.execPath = ref[1];
      }
      if (spec = options.spec) {
        resolvePath = function(p) {
          return path.resolve(options.cwd, p);
        };
        options.spec = strToArray(spec).map(resolvePath);
      }
      if (envs = options.env) {
        options.env = sanitizeAndConvertNestedArgs(envs);
      }
      if (ro = options.reporterOptions) {
        options.reporterOptions = sanitizeAndConvertNestedArgs(ro);
      }
      if (c = options.config) {
        options.config = sanitizeAndConvertNestedArgs(c);
      }
      configKeys = config.getConfigKeys();
      configValues = _.pick(options, configKeys);
      if (options.config == null) {
        options.config = {};
      }
      _.extend(options.config, configValues);
      options = _.omit(options, configKeys);
      options = normalizeBackslashes(options);
      if (p = options.project || options.runProject) {
        options.projectRoot = path.resolve(options.cwd, p);
      }
      if (op = options.outputPath) {
        options.outputPath = path.resolve(options.cwd, op);
      }
      if (options.runProject) {
        options.run = true;
      }
      if (options.smokeTest) {
        options.pong = options.ping;
      }
      debug("argv options: %o", options);
      return options;
    },
    toArray: function(obj) {
      var ref;
      if (obj == null) {
        obj = {};
      }
      return (ref = _.chain(obj)).pick.apply(ref, whitelist).mapValues(function(val, key) {
        return "--" + key + "=" + (stringify(val));
      }).values().value();
    }
  };

}).call(this);
