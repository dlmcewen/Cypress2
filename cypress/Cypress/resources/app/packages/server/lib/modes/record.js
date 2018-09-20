(function() {
  var Promise, _, api, capture, chalk, check, ciProvider, commitInfo, createInstance, createRun, createRunAndRecordSpecs, debug, env, errors, getSpecRelativePath, haveProjectIdAndKeyButNoRecordOption, isForkPr, la, logException, logger, os, runningInternalTests, terminal, throwIfNoProjectId, updateInstance, updateInstanceStdout, upload, uploadArtifacts, warnIfCiFlag, warnIfProjectIdButNoRecordOption;

  _ = require("lodash");

  os = require("os");

  la = require("lazy-ass");

  chalk = require("chalk");

  check = require("check-more-types");

  debug = require("debug")("cypress:server:record");

  Promise = require("bluebird");

  isForkPr = require("is-fork-pr");

  commitInfo = require("@cypress/commit-info");

  api = require("../api");

  logger = require("../logger");

  errors = require("../errors");

  capture = require("../capture");

  upload = require("../upload");

  env = require("../util/env");

  terminal = require("../util/terminal");

  ciProvider = require("../util/ci_provider");

  logException = function(err) {
    return logger.createException(err).timeout(1000)["catch"](function() {});
  };

  runningInternalTests = function() {
    return env.get("CYPRESS_INTERNAL_E2E_TESTS") === "1";
  };

  warnIfCiFlag = function(ci) {
    var type;
    if (ci) {
      type = (function() {
        switch (false) {
          case !env.get("CYPRESS_CI_KEY"):
            return "CYPRESS_CI_DEPRECATED_ENV_VAR";
          default:
            return "CYPRESS_CI_DEPRECATED";
        }
      })();
      return errors.warning(type);
    }
  };

  haveProjectIdAndKeyButNoRecordOption = function(projectId, options) {
    return (projectId && options.key) && (_.isUndefined(options.record) && _.isUndefined(options.ci));
  };

  warnIfProjectIdButNoRecordOption = function(projectId, options) {
    if (haveProjectIdAndKeyButNoRecordOption(projectId, options)) {
      return errors.warning("PROJECT_ID_AND_KEY_BUT_MISSING_RECORD_OPTION", projectId);
    }
  };

  throwIfNoProjectId = function(projectId) {
    if (!projectId) {
      return errors["throw"]("CANNOT_RECORD_NO_PROJECT_ID");
    }
  };

  getSpecRelativePath = function(spec) {
    return _.get(spec, "relative");
  };

  uploadArtifacts = function(options) {
    var count, nums, screenshotUploadUrls, screenshots, send, shouldUploadVideo, uploads, video, videoUploadUrl;
    if (options == null) {
      options = {};
    }
    video = options.video, screenshots = options.screenshots, videoUploadUrl = options.videoUploadUrl, shouldUploadVideo = options.shouldUploadVideo, screenshotUploadUrls = options.screenshotUploadUrls;
    uploads = [];
    count = 0;
    nums = function() {
      count += 1;
      return chalk.gray("(" + count + "/" + uploads.length + ")");
    };
    send = function(pathToFile, url) {
      var fail, success;
      success = function() {
        return console.log("  - Done Uploading " + (nums()), chalk.blue(pathToFile));
      };
      fail = function(err) {
        debug("failed to upload artifact %o", {
          file: pathToFile,
          stack: err.stack
        });
        return console.log("  - Failed Uploading " + (nums()), chalk.red(pathToFile));
      };
      return uploads.push(upload.send(pathToFile, url).then(success)["catch"](fail));
    };
    if (videoUploadUrl && shouldUploadVideo) {
      send(video, videoUploadUrl);
    }
    if (screenshotUploadUrls) {
      screenshotUploadUrls.forEach(function(obj) {
        var screenshot;
        screenshot = _.find(screenshots, {
          screenshotId: obj.screenshotId
        });
        return send(screenshot.path, obj.uploadUrl);
      });
    }
    if (!uploads.length) {
      console.log("  - Nothing to Upload");
    }
    return Promise.all(uploads)["catch"](function(err) {
      errors.warning("DASHBOARD_CANNOT_UPLOAD_RESULTS", err);
      return logException(err);
    });
  };

  updateInstanceStdout = function(options) {
    var captured, instanceId, stdout;
    if (options == null) {
      options = {};
    }
    instanceId = options.instanceId, captured = options.captured;
    stdout = captured.toString();
    return api.updateInstanceStdout({
      stdout: stdout,
      instanceId: instanceId
    })["catch"](function(err) {
      debug("failed updating instance stdout %o", {
        stack: err.stack
      });
      errors.warning("DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE", err);
      if (err.statusCode !== 503) {
        return logException(err);
      }
    })["finally"](capture.restore);
  };

  updateInstance = function(options) {
    var captured, cypressConfig, error, hooks, instanceId, reporterStats, results, screenshots, stats, stdout, tests, video;
    if (options == null) {
      options = {};
    }
    instanceId = options.instanceId, results = options.results, captured = options.captured;
    stats = results.stats, tests = results.tests, hooks = results.hooks, video = results.video, screenshots = results.screenshots, reporterStats = results.reporterStats, error = results.error;
    video = Boolean(video);
    cypressConfig = options.config;
    stdout = captured.toString();
    screenshots = _.map(screenshots, function(screenshot) {
      return _.omit(screenshot, "path");
    });
    return api.updateInstance({
      stats: stats,
      tests: tests,
      error: error,
      video: video,
      hooks: hooks,
      stdout: stdout,
      instanceId: instanceId,
      screenshots: screenshots,
      reporterStats: reporterStats,
      cypressConfig: cypressConfig
    })["catch"](function(err) {
      debug("failed updating instance %o", {
        stack: err.stack
      });
      errors.warning("DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE", err);
      if (err.statusCode !== 503) {
        return logException(err)["return"](null);
      } else {
        return null;
      }
    });
  };

  createRun = function(options) {
    var git, platform, projectId, recordKey, specPattern, specs;
    if (options == null) {
      options = {};
    }
    projectId = options.projectId, recordKey = options.recordKey, platform = options.platform, git = options.git, specPattern = options.specPattern, specs = options.specs;
    if (recordKey == null) {
      recordKey = env.get("CYPRESS_RECORD_KEY") || env.get("CYPRESS_CI_KEY");
    }
    if (!recordKey) {
      if (isForkPr.isForkPr() && !runningInternalTests()) {
        return errors.warning("RECORDING_FROM_FORK_PR");
      }
      errors["throw"]("RECORD_KEY_MISSING");
    }
    if (specPattern) {
      specPattern = specPattern.join(",");
    }
    specs = _.map(specs, getSpecRelativePath);
    return api.createRun({
      specPattern: specPattern,
      specs: specs,
      projectId: projectId,
      recordKey: recordKey,
      platform: platform,
      ci: {
        params: ciProvider.params(),
        provider: ciProvider.name(),
        buildNumber: ciProvider.buildNum()
      },
      commit: ciProvider.gitInfo({
        sha: git.sha,
        branch: git.branch,
        authorName: git.author,
        authorEmail: git.email,
        message: git.message,
        remoteOrigin: git.remote
      })
    })["catch"](function(err) {
      debug("failed creating run %o", {
        stack: err.stack
      });
      switch (err.statusCode) {
        case 401:
          recordKey = recordKey.slice(0, 5) + "..." + recordKey.slice(-5);
          return errors["throw"]("RECORD_KEY_NOT_VALID", recordKey, projectId);
        case 404:
          return errors["throw"]("DASHBOARD_PROJECT_NOT_FOUND", projectId);
        case 412:
          return errors["throw"]("DASHBOARD_INVALID_RUN_REQUEST", err.error);
        default:
          errors.warning("DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE", err);
          return logException(err)["return"](null);
      }
    });
  };

  createInstance = function(options) {
    var groupId, machineId, platform, runId, spec;
    if (options == null) {
      options = {};
    }
    runId = options.runId, groupId = options.groupId, machineId = options.machineId, platform = options.platform, spec = options.spec;
    spec = getSpecRelativePath(spec);
    return api.createInstance({
      spec: spec,
      runId: runId,
      groupId: groupId,
      platform: platform,
      machineId: machineId
    })["catch"](function(err) {
      debug("failed creating instance %o", {
        stack: err.stack
      });
      errors.warning("DASHBOARD_CANNOT_CREATE_RUN_OR_INSTANCE", err);
      if (err.statusCode !== 503) {
        return logException(err)["return"](null);
      } else {
        return null;
      }
    });
  };

  createRunAndRecordSpecs = function(options) {
    var browser, projectId, projectRoot, recordKey, runAllSpecs, specPattern, specs, sys;
    if (options == null) {
      options = {};
    }
    specPattern = options.specPattern, specs = options.specs, sys = options.sys, browser = options.browser, projectId = options.projectId, projectRoot = options.projectRoot, runAllSpecs = options.runAllSpecs;
    recordKey = options.key;
    return commitInfo.commitInfo(projectRoot).then(function(git) {
      var platform;
      platform = {
        osCpus: sys.osCpus,
        osName: sys.osName,
        osMemory: sys.osMemory,
        osVersion: sys.osVersion,
        browserName: browser.displayName,
        browserVersion: browser.version
      };
      return createRun({
        git: git,
        specs: specs,
        platform: platform,
        recordKey: recordKey,
        projectId: projectId,
        specPattern: specPattern
      }).then(function(resp) {
        var afterSpecRun, beforeSpecRun, captured, groupId, instanceId, machineId, runId, runUrl;
        if (!resp) {
          return runAllSpecs();
        } else {
          runUrl = resp.runUrl, runId = resp.runId, machineId = resp.machineId, groupId = resp.groupId;
          captured = null;
          instanceId = null;
          beforeSpecRun = function(spec) {
            capture.restore();
            captured = capture.stdout();
            return createInstance({
              spec: spec,
              runId: runId,
              groupId: groupId,
              platform: platform,
              machineId: machineId
            }).then(function(id) {
              return instanceId = id;
            });
          };
          afterSpecRun = function(results, config) {
            if (!instanceId) {
              return;
            }
            console.log("");
            terminal.header("Uploading Results", {
              color: ["blue"]
            });
            console.log("");
            return updateInstance({
              config: config,
              results: results,
              captured: captured,
              instanceId: instanceId
            }).then(function(resp) {
              var screenshotUploadUrls, screenshots, shouldUploadVideo, video, videoUploadUrl;
              if (!resp) {
                return;
              }
              video = results.video, shouldUploadVideo = results.shouldUploadVideo, screenshots = results.screenshots;
              videoUploadUrl = resp.videoUploadUrl, screenshotUploadUrls = resp.screenshotUploadUrls;
              return uploadArtifacts({
                video: video,
                screenshots: screenshots,
                videoUploadUrl: videoUploadUrl,
                shouldUploadVideo: shouldUploadVideo,
                screenshotUploadUrls: screenshotUploadUrls
              })["finally"](function() {
                return updateInstanceStdout({
                  captured: captured,
                  instanceId: instanceId
                });
              });
            });
          };
          return runAllSpecs(beforeSpecRun, afterSpecRun, runUrl);
        }
      });
    });
  };

  module.exports = {
    createRun: createRun,
    createInstance: createInstance,
    updateInstance: updateInstance,
    updateInstanceStdout: updateInstanceStdout,
    uploadArtifacts: uploadArtifacts,
    warnIfCiFlag: warnIfCiFlag,
    throwIfNoProjectId: throwIfNoProjectId,
    warnIfProjectIdButNoRecordOption: warnIfProjectIdButNoRecordOption,
    createRunAndRecordSpecs: createRunAndRecordSpecs
  };

}).call(this);
