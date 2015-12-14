'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let schema = Schema({
  _test: { type: Schema.Types.ObjectId, ref: 'test', required: true },
  name: { type: String, required: true, unique: true }
}, { autoIndex: false });

module.exports = {
  name: 'testreferrer',
  factory: function (connection) {
    return connection.model('testreferrer', schema)
  }
};
