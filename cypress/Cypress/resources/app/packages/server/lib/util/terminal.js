(function() {
  var EXPECTED_SUM, MAXIMUM_SIZE, Table, _, chalk, convertDecimalsToNumber, divider, getBordersLength, getChars, getMaximumColumns, header, renderTables, table, terminalSize, utils, widestLine, wrapBordersInGray,
    slice = [].slice;

  _ = require("lodash");

  chalk = require("chalk");

  Table = require("cli-table2");

  utils = require("cli-table2/src/utils");

  widestLine = require("widest-line");

  terminalSize = require("./terminal-size");

  MAXIMUM_SIZE = 100;

  EXPECTED_SUM = 100;

  getMaximumColumns = function() {
    return Math.min(MAXIMUM_SIZE, terminalSize.get().columns);
  };

  getBordersLength = function(left, right) {
    return _.chain([left, right]).compact().map(widestLine).sum().value();
  };

  convertDecimalsToNumber = function(colWidths, cols) {
    var diff, first, sum, total, widths;
    sum = _.sum(colWidths);
    if (sum !== EXPECTED_SUM) {
      throw new Error("Expected colWidths array to sum to: " + EXPECTED_SUM + ", instead got: " + sum);
    }
    [50, 10, 25];
    widths = _.map(colWidths, function(width) {
      var num;
      num = (cols * width) / EXPECTED_SUM;
      return Math.floor(num);
    });
    total = _.sum(widths);
    if ((diff = cols - total) > 0) {
      first = widths[0];
      widths[0] += diff;
    }
    return widths;
  };

  renderTables = function() {
    var tables;
    tables = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return _.chain([]).concat(tables).invokeMap("toString").join("\n").value();
  };

  getChars = function(type) {
    switch (type) {
      case "border":
        return {
          "top-mid": "",
          "top-left": "  ┌",
          "left": "  │",
          "left-mid": "  ├",
          "middle": "",
          "mid-mid": "",
          "bottom-mid": "",
          "bottom-left": "  └"
        };
      case "noBorder":
        return {
          "top": "",
          "top-mid": "",
          "top-left": "",
          "top-right": "",
          "left": "   ",
          "left-mid": "",
          "middle": "",
          "mid": "",
          "mid-mid": "",
          "right": "",
          "right-mid": "",
          "bottom": "",
          "bottom-left": "",
          "bottom-mid": "",
          "bottom-right": ""
        };
      case "outsideBorder":
        return {
          "top-left": "  ┌",
          "top-mid": "",
          "left": "  │",
          "left-mid": "",
          "middle": "",
          "mid": "",
          "mid-mid": "",
          "right-mid": "",
          "bottom-mid": "",
          "bottom-left": "  └"
        };
      case "pageDivider":
        return {
          "top": "─",
          "top-mid": "",
          "top-left": "",
          "top-right": "",
          "bottom": "",
          "bottom-mid": "",
          "bottom-left": "",
          "bottom-right": "",
          "left": "",
          "left-mid": "",
          "mid": "",
          "mid-mid": "",
          "right": "",
          "right-mid": "",
          "middle": ""
        };
    }
  };

  wrapBordersInGray = function(chars) {
    return _.mapValues(chars, function(char) {
      if (char) {
        return chalk.gray(char);
      } else {
        return char;
      }
    });
  };

  table = function(options) {
    var borders, chars, colWidths, cols, defaults, type;
    if (options == null) {
      options = {};
    }
    colWidths = options.colWidths, type = options.type;
    defaults = utils.mergeOptions({});
    chars = _.defaults(getChars(type), defaults.chars);
    _.defaultsDeep(options, {
      chars: chars,
      style: {
        head: [],
        border: [],
        'padding-left': 1,
        'padding-right': 1
      }
    });
    chars = options.chars;
    borders = getBordersLength(chars.left, chars.right);
    options.chars = wrapBordersInGray(chars);
    if (colWidths) {
      cols = getMaximumColumns() - borders;
      options.colWidths = convertDecimalsToNumber(colWidths, cols);
    }
    return new Table(options);
  };

  header = function(message, options) {
    var c, colors;
    if (options == null) {
      options = {};
    }
    _.defaults(options, {
      color: null
    });
    message = "  (" + chalk.underline.bold(message) + ")";
    if (c = options.color) {
      colors = [].concat(c);
      message = _.reduce(colors, function(memo, color) {
        return chalk[color](memo);
      }, message);
    }
    return console.log(message);
  };

  divider = function(symbol, color) {
    var cols, str;
    if (color == null) {
      color = "gray";
    }
    cols = getMaximumColumns();
    str = symbol.repeat(cols);
    return console.log(chalk[color](str));
  };

  module.exports = {
    table: table,
    header: header,
    divider: divider,
    renderTables: renderTables,
    getMaximumColumns: getMaximumColumns,
    convertDecimalsToNumber: convertDecimalsToNumber
  };

}).call(this);
