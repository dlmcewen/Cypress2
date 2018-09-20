(function() {
  var _, buildNums, check, getCirclePrNumber, getGitInfo, getProviderName, groupIds, isCodeship, isGitlab, isWercker, la, params, providers, pullRequestUrlToString;

  _ = require("lodash");

  la = require("lazy-ass");

  check = require("check-more-types");

  isCodeship = function() {
    return process.env.CI_NAME && process.env.CI_NAME === "codeship";
  };

  isGitlab = function() {
    return process.env.GITLAB_CI || process.env.CI_SERVER_NAME && process.env.CI_SERVER_NAME === "GitLab CI";
  };

  isWercker = function() {
    return process.env.WERCKER || process.env.WERCKER_MAIN_PIPELINE_STARTED;
  };

  providers = {
    "appveyor": "APPVEYOR",
    "bamboo": "bamboo_planKey",
    "buildkite": "BUILDKITE",
    "circle": "CIRCLECI",
    "codeship": isCodeship,
    "drone": "DRONE",
    "gitlab": isGitlab,
    "hudson": "HUDSON_URL",
    "jenkins": "JENKINS_URL",
    "semaphore": "SEMAPHORE",
    "shippable": "SHIPPABLE",
    "snap": "SNAP_CI",
    "teamcity": "TEAMCITY_VERSION",
    "teamfoundation": "TF_BUILD",
    "travis": "TRAVIS",
    "wercker": isWercker
  };

  buildNums = function(provider) {
    return {
      appveyor: process.env.APPVEYOR_BUILD_NUMBER,
      circle: process.env.CIRCLE_BUILD_NUM,
      codeship: process.env.CI_BUILD_NUMBER,
      drone: process.env.DRONE_BUILD_NUMBER,
      gitlab: process.env.CI_BUILD_ID,
      jenkins: process.env.BUILD_NUMBER,
      semaphore: process.env.SEMAPHORE_BUILD_NUMBER,
      travis: process.env.TRAVIS_BUILD_NUMBER
    }[provider];
  };

  groupIds = function(provider) {
    return {
      circle: process.env.CIRCLE_WORKFLOW_ID
    }[provider];
  };

  params = function(provider) {
    return {
      appveyor: {
        accountName: process.env.APPVEYOR_ACCOUNT_NAME,
        projectSlug: process.env.APPVEYOR_PROJECT_SLUG,
        buildVersion: process.env.APPVEYOR_BUILD_VERSION
      },
      circle: {
        buildUrl: process.env.CIRCLE_BUILD_URL
      },
      codeship: {
        buildUrl: process.env.CI_BUILD_URL
      },
      drone: {
        buildUrl: process.env.DRONE_BUILD_LINK
      },
      gitlab: {
        buildId: process.env.CI_BUILD_ID,
        projectUrl: process.env.CI_PROJECT_URL
      },
      jenkins: {
        buildUrl: process.env.BUILD_URL
      },
      semaphore: {
        repoSlug: process.env.SEMAPHORE_REPO_SLUG
      },
      travis: {
        buildId: process.env.TRAVIS_BUILD_ID,
        repoSlug: process.env.TRAVIS_REPO_SLUG
      }
    }[provider];
  };

  getProviderName = function() {
    var name;
    name = _.findKey(providers, function(value, key) {
      switch (false) {
        case !_.isString(value):
          return process.env[value];
        case !_.isFunction(value):
          return value();
      }
    });
    return name || "unknown";
  };

  pullRequestUrlToString = function(url) {
    la(check.url(url), "expected pull request url", url);
    return _.last(url.split("/"));
  };

  getCirclePrNumber = function(envPrNumber, envPrUrl) {
    if (envPrNumber) {
      return envPrNumber;
    }
    if (envPrUrl) {
      return pullRequestUrlToString(envPrUrl);
    }
  };

  getGitInfo = function(provider, key) {
    var ref;
    return ({
      appveyor: {
        sha: process.env.APPVEYOR_REPO_COMMIT,
        branch: process.env.APPVEYOR_PULL_REQUEST_HEAD_REPO_BRANCH || process.env.APPVEYOR_REPO_BRANCH,
        authorName: process.env.APPVEYOR_REPO_COMMIT_AUTHOR,
        authorEmail: process.env.APPVEYOR_REPO_COMMIT_AUTHOR_EMAIL,
        message: process.env.APPVEYOR_REPO_COMMIT_MESSAGE + ((ref = process.env.APPVEYOR_REPO_COMMIT_MESSAGE_EXTENDED) != null ? ref : ""),
        pullRequestId: process.env.APPVEYOR_PULL_REQUEST_NUMBER
      },
      bamboo: {},
      buildkite: {
        sha: process.env.BUILDKITE_COMMIT,
        branch: process.env.BUILDKITE_BRANCH,
        authorName: process.env.BUILDKITE_BUILD_CREATOR,
        authorEmail: process.env.BUILDKITE_BUILD_CREATOR_EMAIL,
        message: process.env.BUILDKITE_MESSAGE,
        pullRequestId: process.env.BUILDKITE_PULL_REQUEST,
        defaultBranch: process.env.BUILDKITE_PIPELINE_DEFAULT_BRANCH
      },
      circle: {
        sha: process.env.CIRCLE_SHA1,
        branch: process.env.CIRCLE_BRANCH,
        authorName: process.env.CIRCLE_USERNAME,
        pullRequestId: getCirclePrNumber(process.env.CIRCLE_PR_NUMBER, process.env.CIRCLE_PULL_REQUEST)
      },
      codeship: {
        sha: process.env.CI_COMMIT_ID,
        branch: process.env.CI_BRANCH,
        authorName: process.env.CI_COMMITTER_NAME,
        authorEmail: process.env.CI_COMMITTER_EMAIL,
        message: process.env.CI_COMMIT_MESSAGE
      },
      drone: {
        sha: process.env.DRONE_COMMIT_SHA,
        branch: process.env.DRONE_COMMIT_BRANCH,
        authorName: process.env.DRONE_COMMIT_AUTHOR,
        authorEmail: process.env.DRONE_COMMIT_AUTHOR_EMAIL,
        message: process.env.DRONE_COMMIT_MESSAGE,
        pullRequestId: process.env.DRONE_PULL_REQUEST,
        defaultBranch: process.env.DRONE_REPO_BRANCH
      },
      gitlab: {
        sha: process.env.CI_COMMIT_SHA,
        branch: process.env.CI_COMMIT_REF_NAME,
        authorName: process.env.GITLAB_USER_NAME,
        authorEmail: process.env.GITLAB_USER_EMAIL,
        message: process.env.CI_COMMIT_MESSAGE
      },
      hudson: {},
      jenkins: {
        sha: process.env.GIT_COMMIT,
        branch: process.env.GIT_BRANCH,
        pullRequestId: process.env.ghprbPullId
      },
      semaphore: {
        pullRequestId: process.env.PULL_REQUEST_NUMBER
      },
      shippable: {
        sha: process.env.COMMIT,
        branch: process.env.BRANCH,
        authorName: process.env.COMMITTER,
        message: process.env.COMMIT_MESSAGE,
        pullRequestId: process.env.PULL_REQUEST
      },
      snap: {},
      teamcity: {},
      teamfoundation: {},
      travis: {
        sha: process.env.TRAVIS_COMMIT,
        branch: process.env.TRAVIS_PULL_REQUEST_BRANCH || process.env.TRAVIS_BRANCH,
        message: process.env.TRAVIS_COMMIT_MESSAGE,
        pullRequestId: process.env.TRAVIS_PULL_REQUEST
      },
      wercker: {}
    }[provider] || {})[key];
  };

  module.exports = {
    getCirclePrNumber: getCirclePrNumber,
    name: function() {
      return getProviderName();
    },
    params: function() {
      var ref;
      return (ref = params(getProviderName())) != null ? ref : null;
    },
    buildNum: function() {
      var ref;
      return (ref = buildNums(getProviderName())) != null ? ref : null;
    },
    groupId: function() {
      var ref;
      return (ref = groupIds(getProviderName())) != null ? ref : null;
    },
    gitInfo: function(existingInfo) {
      var providerName;
      providerName = getProviderName();
      return _.transform(existingInfo, function(info, existingValue, key) {
        var ref;
        return info[key] = existingValue != null ? existingValue : (ref = getGitInfo(providerName, key)) != null ? ref : null;
      }, {});
    }
  };

}).call(this);
