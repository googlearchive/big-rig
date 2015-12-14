'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let schema = Schema({
  name: { type: String, required: true, unique: true },
  value: { type: Number },
  createdAt: { type: Date }
}, { autoIndex: false });

module.exports = {
  name: 'test',
  factory: function (connection) {
    return connection.model('test', schema)
  }
};
