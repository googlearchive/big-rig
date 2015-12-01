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

'use strict';

var assert = require('assert');
var proxyquire = require('proxyquire');
var path = require('path');
var rimraf = require('rimraf');

// This is a test and we want descriptions to be useful, if this
// breaks the max-length, it's ok.

/* eslint-disable max-len */

var testOutputPath = path.join(__dirname, './test-output/');
var stubbedMysql = require('./stubbed/mysql');
var DatabaseModel = proxyquire('../src/models/db-model', {
  'mysql': stubbedMysql.stubClass
});

describe('DatabaseModel', function() {
  var CONFIG_PATH = path.join(testOutputPath, 'config', 'db-config.json');

  afterEach(function(done) {
    rimraf(testOutputPath, done);
  });

  describe('new DatabaseModel()', function() {
    it('should instantiate a new database model with default path.', function() {
      assert.doesNotThrow(function() {
        new DatabaseModel();
      });
    });

    it('should instantiate a new database model with custom path.', function() {
      assert.doesNotThrow(function() {
        new DatabaseModel(CONFIG_PATH);
      });
    });
  });

  describe('.saveConfig()', function() {
    it('should reject the promise since there is no config.', function(done) {
      var dbModel = new DatabaseModel(CONFIG_PATH);
      dbModel.saveConfig()
        .then(function() {
          done(new Error());
        })
        .catch(function(err) {
          done();
        });
    });

    it('should reject the promise since the config parameter is null.', function(done) {
      var dbModel = new DatabaseModel(CONFIG_PATH);
      dbModel.saveConfig(null)
        .then(function() {
          done(new Error());
        })
        .catch(function(err) {
          done();
        });
    });

    it('should reject the promise since the config parameter has no attributes.', function(done) {
      var dbModel = new DatabaseModel(CONFIG_PATH);
      dbModel.saveConfig({})
        .then(function() {
          done(new Error());
        })
        .catch(function(err) {
          done();
        });
    });

    it('should reject the promise since the config parameter\'s attributes are all null.', function(done) {
      var dbModel = new DatabaseModel(CONFIG_PATH);
      dbModel.saveConfig({host: null, port: null, user: null, password: null, database: null})
        .then(function() {
          done(new Error());
        })
        .catch(function(err) {
          done();
        });
    });

    it('should reject the promise since the config parameter\'s attributes are all empty strings.', function(done) {
      var dbModel = new DatabaseModel(CONFIG_PATH);
      dbModel.saveConfig({host: '', port: '', user: '', password: '', database: ''})
        .then(function() {
          done(new Error());
        })
        .catch(function(err) {
          done();
        });
    });

    it('should reject the promise since the port parameter is not a number.', function(done) {
      var config = {host: 'invalid-host', port: 'not-a-number', user: 'invalid-username', password: 'invalid-password', database: 'invalid-db'};
      var dbModel = new DatabaseModel(CONFIG_PATH);
      dbModel.saveConfig(config)
        .then(function() {
          done(new Error());
        })
        .catch(function(err) {
          done();
        });
    });

    it('should reject the promise since the config parameter\'s attributes are all invalid.', function(done) {
      var config = {host: 'localhost', port: 3306, user: 'invalid-username', password: 'invalid-password', database: 'invalid-db'};
      var dbModel = new DatabaseModel(CONFIG_PATH);
      dbModel.saveConfig(config)
        .then(function() {
          done(new Error());
        })
        .catch(function(err) {
          done();
        });
    });

    it('should resolve the promise by mocking out createConnection method.', function(done) {
      var dbModel = new DatabaseModel(CONFIG_PATH);
      dbModel.saveConfig(stubbedMysql.VALID_CONFIG)
        .then(function() {
          done();
        })
        .catch(function(err) {
          done(new Error(err));
        });
    });
  });

  describe('.getConfig()', function() {
    it('should return null for a non-existing config file.', function(done) {
      var dbModel = new DatabaseModel();
      dbModel.getConfig()
        .then(function(savedConfig) {
          if (savedConfig !== null) {
            done(new Error());
            return;
          }

          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should get the same config out as originally put into the testConfig.', function(done) {
      var dbModel = new DatabaseModel(CONFIG_PATH);
      dbModel.saveConfig(stubbedMysql.VALID_CONFIG)
        .then(function() {
          var configDBModel = new DatabaseModel(CONFIG_PATH);
          configDBModel.getConfig()
          .then((savedConfig) => {
            var configKeys = Object.keys(savedConfig);
            for (var i = 0; i < configKeys.length; i++) {
              var keyName = configKeys[i];
              if (savedConfig[keyName] !== stubbedMysql.VALID_CONFIG[keyName]) {
                done(new Error());
                return;
              }
            }

            done();
          })
          .catch((err) => {
            done(err);
          });
        })
        .catch(function(err) {
          done(err);
        });
    });
  });

  describe('.open()', function() {
    it('should throw an error since no config saved', function(done) {
      var dbModel = new DatabaseModel();
      dbModel.open()
        .then(function() {
          done(new Error());
        })
        .catch(function() {
          done();
        });
    });

    it('should open and return a connection for saved config', function(done) {
      var dbModel = new DatabaseModel(CONFIG_PATH);
      dbModel.saveConfig(stubbedMysql.VALID_CONFIG)
        .then(function() {
          var configDBModel = new DatabaseModel(CONFIG_PATH);
          configDBModel.open()
          .then((connection) => {
            if (!connection) {
              done(new Error());
              return;
            }

            done();
          })
          .catch((err) => {
            done(err);
          });
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
