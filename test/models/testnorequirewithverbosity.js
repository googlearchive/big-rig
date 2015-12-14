'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let schema = Schema({
  name: { type: String }
});

schema.post('save', function () {
  console.log('Saved test model');
});

module.exports = {
  name: 'testnorequirewithverbosity',
  factory: function (connection) {
    return connection.model('testnorequirewithverbosity', schema);
  }
};
