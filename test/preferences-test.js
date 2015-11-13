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

var expect = require('chai').expect;
var proxyquire = require('proxyquire');
var sinon = require('sinon');
var path = require('path');

// This is a test and want descriptions to be useful, if this
// breaks the max-length, it's ok.

/* eslint-disable max-len */

describe('models.Preferences', function() {
  var VALID_NEW_FILEPATH = './.preferences/new-preferences.json';
  var VALID_EXISTING_FILEPATH = './.preferences/existing-preferences.json';
  var VALID_NEW_KEY = 'valid-new-key';
  var VALID_EXISTING_KEY = 'valid-existing-key';
  var EXISTING_VALUE = 'valid-existing-value';
  var NEW_VALUE = 'valid-new-value';
  var TEST_PREFERENCE_OBJECT = {};
  TEST_PREFERENCE_OBJECT[VALID_EXISTING_KEY] = EXISTING_VALUE;

  var stubs = [];

  beforeEach(function() {
    for (var i = 0; i < stubs.length; i++) {
      if (stubs[i].restore) {
        stubs[i].restore();
      }
    }

    stubs = [];
  });

  describe('new Preferences()', function() {
    var PreferencesClass = require('../src/models/preferences');

    var INVALID_ABSOLUTE_FILEPATH = '/.preferences/invalid-absolute-preferences.json';
    var INVALID_NO_FILENAME_FILEPATH = './.preferences/no-filename/';

    // Constructor with no parameters
    it ('should throw an error due to no parameters', function() {
      expect(() => {
        new PreferencesClass();
      }).to.throw(Error);
    });

    // Constructor with null parameters
    it ('should throw an error due to parameters being null', function() {
      expect(() => {
        new PreferencesClass(null);
      }).to.throw(Error);
    });

    // Constructor with empty string
    it ('should throw an error due to parameter being an empty string', function() {
      expect(() => {
        new PreferencesClass('');
      }).to.throw(Error);
    });

    // Constructor with filepath that is absolute
    it ('should throw an error due to passing in an absolute filepath', function() {
      expect(() => {
        new PreferencesClass(INVALID_ABSOLUTE_FILEPATH);
      }).to.throw(Error);
    });

    // Constructor with filepath that is absolute
    it ('should throw an error due to passing in a filepath with no filename', function() {
      expect(() => {
        new PreferencesClass(INVALID_NO_FILENAME_FILEPATH);
      }).to.throw(Error);
    });

    // Constructor wtih filepath that doesn't exist
    it ('should not throw an error for a new filepath', function() {
      expect(() => {
        new PreferencesClass(VALID_NEW_FILEPATH);
      }).to.not.throw(Error);
    });

    // Constructor with filepath that already exists
    it ('should not throw an error for an existing filepath', function() {
      expect(() => {
        new PreferencesClass(VALID_EXISTING_FILEPATH);
      }).to.not.throw(Error);
    });
  });

  describe('Preferences.get()', function() {
    var PreferencesClass;

    before(function() {
      var fsStub = {};

      var existsSyncStub = sinon.stub();
      existsSyncStub.withArgs(VALID_NEW_FILEPATH).returns(false);
      existsSyncStub.withArgs(VALID_EXISTING_FILEPATH).returns(true);
      existsSyncStub.throws(new Error('Unexpected filepath passed to fs.existsSync for test suite.'));
      fsStub.existsSync = existsSyncStub;

      var readFileSyncStub = sinon.stub();
      readFileSyncStub.withArgs(VALID_EXISTING_FILEPATH).returns(JSON.stringify(TEST_PREFERENCE_OBJECT));
      readFileSyncStub.throws(new Error('Unexpected filepath passed to fs.existsSync for test suite.'));
      fsStub.readFileSync = readFileSyncStub;

      stubs.push(existsSyncStub);
      stubs.push(readFileSyncStub);

      PreferencesClass = proxyquire('../src/models/preferences', {
        'fs': fsStub
      });
    });

    // get with no parameters
    it ('should throw an error for no parameters', function() {
      expect(() => {
        new PreferencesClass(VALID_EXISTING_FILEPATH).get();
      }).to.throw(Error);
    });

    // get with null parameters
    it ('should throw an error for null parameter', function() {
      expect(() => {
        new PreferencesClass(VALID_EXISTING_FILEPATH).get(null);
      }).to.throw(Error);
    });

    // get with empty string
    it ('should throw an error for empty string parameter', function() {
      expect(() => {
        new PreferencesClass(VALID_EXISTING_FILEPATH).get('');
      }).to.throw(Error);
    });

    // get with valid key but no preferences file
    it ('should return null for a new preferences file requesting a new key', function() {
      var value = new PreferencesClass(VALID_NEW_FILEPATH).get(VALID_NEW_KEY);
      expect(value).to.equal(null);
    });

    // get with valid new key with existing preferences file
    it ('should return null for existing preferences file with a new key', function() {
      var value = new PreferencesClass(VALID_EXISTING_FILEPATH).get(VALID_NEW_KEY);
      expect(value).to.equal(null);
    });

    // get with existing key with existing preferences file
    it ('should return the existing value for the existing key in the existing preferences file', function() {
      var value = new PreferencesClass(VALID_EXISTING_FILEPATH).get(VALID_EXISTING_KEY);
      expect(value).to.equal(EXISTING_VALUE);
    });
  });

  describe('Preferences.set()', function() {
    var PreferencesClass;
    var writeCallback;

    before(function() {
      var fsStub = {};
      var mkdirpStub = {};

      var existsSyncStub = sinon.stub();
      existsSyncStub.withArgs(VALID_NEW_FILEPATH).returns(false);
      existsSyncStub.withArgs(VALID_EXISTING_FILEPATH).returns(true);
      existsSyncStub.throws(new Error('Unexpected filepath passed to fs.existsSync for test suite.'));
      fsStub.existsSync = existsSyncStub;

      var readFileSyncStub = sinon.stub();
      readFileSyncStub.withArgs(VALID_EXISTING_FILEPATH).returns(JSON.stringify(TEST_PREFERENCE_OBJECT));
      readFileSyncStub.throws(new Error('Unexpected filepath passed to fs.existsSync for test suite.'));
      fsStub.readFileSync = readFileSyncStub;

      fsStub.writeFileSync = function(path, string) {
        if (writeCallback) {
          writeCallback(path, string);
        }
      };

      var mkdirpSyncStub = sinon.stub();
      mkdirpSyncStub.withArgs(path.dirname(VALID_NEW_FILEPATH)).returns();
      mkdirpSyncStub.throws(new Error('Unexpected filepath passed to mkdirp.existsSync for test suite.'));
      mkdirpStub.sync = mkdirpSyncStub;

      stubs.push(existsSyncStub);
      stubs.push(readFileSyncStub);
      stubs.push(mkdirpSyncStub);

      PreferencesClass = proxyquire('../src/models/preferences', {
        'fs': fsStub,
        'mkdirp': mkdirpStub
      });
    });

    // set with no parameters
    it ('should throw an error for no parameters', function() {
      expect(() => {
        new PreferencesClass(VALID_EXISTING_FILEPATH).set();
      }).to.throw(Error);
    });

    // set with null parameters
    it ('should throw an error for null parameters', function() {
      expect(() => {
        new PreferencesClass(VALID_EXISTING_FILEPATH).set(null, null);
      }).to.throw(Error);
    });

    // set with empty key parameter
    it ('should throw an error for empty string for key parameter', function() {
      expect(() => {
        new PreferencesClass(VALID_EXISTING_FILEPATH).set('', NEW_VALUE);
      }).to.throw(Error);
    });

    // set new value to new preferences file
    it ('should create new folder and should write new value to new file', function() {
      writeCallback = function(path, value) {
        var preferences = JSON.parse(value)
        expect(path).to.equal(VALID_NEW_FILEPATH);
        expect(preferences[VALID_NEW_KEY]).to.equal(NEW_VALUE);
      };
      new PreferencesClass(VALID_NEW_FILEPATH).set(VALID_NEW_KEY, NEW_VALUE);
    });

    // set new value for new key to existing preferences file
    it ('should assign to new value to existing preferences file', function() {
      writeCallback = function(path, value) {
        var preferences = JSON.parse(value)
        expect(path).to.equal(VALID_EXISTING_FILEPATH);
        expect(preferences[VALID_NEW_KEY]).to.equal(NEW_VALUE);
      };

      new PreferencesClass(VALID_EXISTING_FILEPATH).set(VALID_NEW_KEY, NEW_VALUE);
    });

    // set new value for existing key to existing preferences file
    it ('should assign to new value to existing key to existing preferences file', function() {
      writeCallback = function(path, value) {
        var preferences = JSON.parse(value)
        expect(path).to.equal(VALID_EXISTING_FILEPATH);
        expect(preferences[VALID_EXISTING_KEY]).to.equal(NEW_VALUE);
      };

      new PreferencesClass(VALID_EXISTING_FILEPATH).set(VALID_EXISTING_KEY, NEW_VALUE);
    });
  });
});
