/**
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var sinon = require('sinon');
var mysqlDriver = require('mysql');

var VALID_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'fake-valid-user',
  password: 'fake-valid-password',
  database: 'fake-valid-db'
};

var VALID_CONNECTION_OBJECT = {
  connect: function(cb) {
    cb();
  },
  end: function() {
    // NOOP
  },
  query: function(queryString, cb) {
    // Use is to select a specific database
    if (queryString.indexOf('USE') === 0) {
      cb();
      return;
    }

    cb(new Error('[From Stub]: Unknown request'));
  }
};

var MysqlStub = sinon.stub(mysqlDriver, 'createConnection');
MysqlStub.withArgs(VALID_CONFIG).returns(VALID_CONNECTION_OBJECT);

module.exports = {
  VALID_CONFIG: VALID_CONFIG,
  stubClass: MysqlStub
};
