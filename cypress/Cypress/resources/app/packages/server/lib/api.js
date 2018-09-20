(function() {
  var Promise, _, browsers, debug, errors, formatResponseBody, machineId, nmi, os, pkg, request, routes, rp, system, tagError;

  _ = require("lodash");

  os = require("os");

  nmi = require("node-machine-id");

  request = require("request-promise");

  errors = require("request-promise/errors");

  Promise = require("bluebird");

  pkg = require("@packages/root");

  browsers = require('./browsers');

  routes = require("./util/routes");

  system = require("./util/system");

  debug = require("debug")("cypress:server:api");

  rp = request.defaults(function(params, callback) {
    var headers, method;
    if (params == null) {
      params = {};
    }
    _.defaults(params, {
      gzip: true
    });
    headers = params.headers != null ? params.headers : params.headers = {};
    _.defaults(headers, {
      "x-os-name": os.platform(),
      "x-cypress-version": pkg.version
    });
    method = params.method.toLowerCase();
    return request[method](params, callback);
  });

  formatResponseBody = function(err) {
    var body;
    if (_.isObject(err.error)) {
      body = JSON.stringify(err.error, null, 2);
      err.message = [err.statusCode, body].join("\n\n");
    }
    throw err;
  };

  tagError = function(err) {
    err.isApiError = true;
    throw err;
  };

  machineId = function() {
    return nmi.machineId()["catch"](function() {
      return null;
    });
  };

  module.exports = {
    ping: function() {
      return rp.get(routes.ping())["catch"](tagError);
    },
    getOrgs: function(authToken) {
      return rp.get({
        url: routes.orgs(),
        json: true,
        auth: {
          bearer: authToken
        }
      })["catch"](tagError);
    },
    getProjects: function(authToken) {
      return rp.get({
        url: routes.projects(),
        json: true,
        auth: {
          bearer: authToken
        }
      })["catch"](tagError);
    },
    getProject: function(projectId, authToken) {
      return rp.get({
        url: routes.project(projectId),
        json: true,
        auth: {
          bearer: authToken
        },
        headers: {
          "x-route-version": "2"
        }
      })["catch"](tagError);
    },
    getProjectRuns: function(projectId, authToken, options) {
      var ref;
      if (options == null) {
        options = {};
      }
      if (options.page == null) {
        options.page = 1;
      }
      return rp.get({
        url: routes.projectRuns(projectId),
        json: true,
        timeout: (ref = options.timeout) != null ? ref : 10000,
        auth: {
          bearer: authToken
        },
        headers: {
          "x-route-version": "2"
        }
      })["catch"](errors.StatusCodeError, formatResponseBody)["catch"](tagError);
    },
    createRun: function(options) {
      var body, ref;
      if (options == null) {
        options = {};
      }
      body = _.pick(options, ["projectId", "recordKey", "ci", "specs", "commit", "platform", "specPattern"]);
      return rp.post({
        body: body,
        url: routes.runs(),
        json: true,
        timeout: (ref = options.timeout) != null ? ref : 10000,
        headers: {
          "x-route-version": "3"
        }
      })["catch"](errors.StatusCodeError, formatResponseBody)["catch"](tagError);
    },
    createInstance: function(options) {
      var body, runId, timeout;
      if (options == null) {
        options = {};
      }
      runId = options.runId, timeout = options.timeout;
      body = _.pick(options, ["spec", "groupId", "machineId", "platform"]);
      return rp.post({
        body: body,
        url: routes.instances(runId),
        json: true,
        timeout: timeout != null ? timeout : 10000,
        headers: {
          "x-route-version": "4"
        }
      }).promise().get("instanceId")["catch"](errors.StatusCodeError, formatResponseBody)["catch"](tagError);
    },
    updateInstanceStdout: function(options) {
      var ref;
      if (options == null) {
        options = {};
      }
      return rp.put({
        url: routes.instanceStdout(options.instanceId),
        json: true,
        timeout: (ref = options.timeout) != null ? ref : 10000,
        body: {
          stdout: options.stdout
        }
      })["catch"](errors.StatusCodeError, formatResponseBody)["catch"](tagError);
    },
    updateInstance: function(options) {
      var ref;
      if (options == null) {
        options = {};
      }
      return rp.put({
        url: routes.instance(options.instanceId),
        json: true,
        timeout: (ref = options.timeout) != null ? ref : 10000,
        headers: {
          "x-route-version": "2"
        },
        body: _.pick(options, ["stats", "tests", "error", "video", "hooks", "stdout", "screenshots", "cypressConfig", "reporterStats"])
      })["catch"](errors.StatusCodeError, formatResponseBody)["catch"](tagError);
    },
    createRaygunException: function(body, authToken, timeout) {
      if (timeout == null) {
        timeout = 3000;
      }
      return rp.post({
        url: routes.exceptions(),
        json: true,
        body: body,
        auth: {
          bearer: authToken
        }
      }).promise().timeout(timeout)["catch"](tagError);
    },
    createSignin: function(code) {
      return machineId().then(function(id) {
        var h;
        h = {
          "x-route-version": "3",
          "x-accept-terms": "true"
        };
        if (id) {
          h["x-machine-id"] = id;
        }
        return rp.post({
          url: routes.signin({
            code: code
          }),
          json: true,
          headers: h
        })["catch"](errors.StatusCodeError, function(err) {
          err.message = err.error;
          throw err;
        })["catch"](tagError);
      });
    },
    createSignout: function(authToken) {
      return rp.post({
        url: routes.signout(),
        json: true,
        auth: {
          bearer: authToken
        }
      })["catch"]({
        statusCode: 401
      }, function() {})["catch"](tagError);
    },
    createProject: function(projectDetails, remoteOrigin, authToken) {
      return rp.post({
        url: routes.projects(),
        json: true,
        auth: {
          bearer: authToken
        },
        headers: {
          "x-route-version": "2"
        },
        body: {
          name: projectDetails.projectName,
          orgId: projectDetails.orgId,
          "public": projectDetails["public"],
          remoteOrigin: remoteOrigin
        }
      })["catch"](errors.StatusCodeError, formatResponseBody)["catch"](tagError);
    },
    getProjectRecordKeys: function(projectId, authToken) {
      return rp.get({
        url: routes.projectRecordKeys(projectId),
        json: true,
        auth: {
          bearer: authToken
        }
      })["catch"](tagError);
    },
    requestAccess: function(projectId, authToken) {
      return rp.post({
        url: routes.membershipRequests(projectId),
        json: true,
        auth: {
          bearer: authToken
        }
      })["catch"](errors.StatusCodeError, formatResponseBody)["catch"](tagError);
    },
    getLoginUrl: function() {
      return rp.get({
        url: routes.auth(),
        json: true
      }).promise().get("url")["catch"](tagError);
    },
    _projectToken: function(method, projectId, authToken) {
      return rp({
        method: method,
        url: routes.projectToken(projectId),
        json: true,
        auth: {
          bearer: authToken
        },
        headers: {
          "x-route-version": "2"
        }
      }).promise().get("apiToken")["catch"](tagError);
    },
    getProjectToken: function(projectId, authToken) {
      return this._projectToken("get", projectId, authToken);
    },
    updateProjectToken: function(projectId, authToken) {
      return this._projectToken("put", projectId, authToken);
    }
  };

}).call(this);
