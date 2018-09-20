(function() {
  var id, random;

  random = require("randomstring");

  id = function() {
    return random.generate({
      length: 5,
      capitalization: "lowercase"
    });
  };

  module.exports = {
    id: id
  };

}).call(this);
