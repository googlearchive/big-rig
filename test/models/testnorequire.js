'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let schema = Schema({
  name: {
    type: String
  }
});

module.exports = {
  name: 'testnorequire',
  factory: function (connection) {
    return connection.model('testnorequire', schema);
  }
};
