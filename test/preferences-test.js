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


// This is a test and want descriptions to be useful, if this
// breaks the max-length, it's ok.

/* eslint-disable max-len */

describe('models.Preferences', function() {
  var VALID_NEW_FILEPATH = './.preferences/new-preferences.json';
  var VALID_EXISTING_FILEPATH = './.preferences/existing-preferences.json';

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
    var stubs = [];

    var VALID_NEW_KEY = 'valid-new-key';
    var VALID_EXISTING_KEY = 'valid-existing-key';
    var EXISTING_VALUE = 'valid-existing-value';
    var TEST_PREFERENCE_OBJECT = {};
    TEST_PREFERENCE_OBJECT[VALID_EXISTING_KEY] = EXISTING_VALUE;

    before(function() {
      var fs = require('fs');

      var existsSyncStub = sinon.stub(fs, 'existsSync');
      existsSyncStub.withArgs(VALID_NEW_FILEPATH).return(false);
      existsSyncStub.withArgs(VALID_EXISTING_FILEPATH).return(true);
      existsSyncStub.throws(new Error('Unexpected filepath passed to fs.existsSync for test suite.'));

      var readFileSyncStub = sinon.stub(fs, 'readFileSync');
      readFileSyncStub.withArgs(VALID_EXISTING_FILEPATH).return(JSON.stringify(TEST_PREFERENCE_OBJECT));
      readFileSyncStub.throws(new Error('Unexpected filepath passed to fs.existsSync for test suite.'));

      stubs.push(existsSyncStub);
      stubs.push(readFileSyncStub);

      PreferencesClass = proxyquire('../src/models/preferences', {
        'fs': fs
      });
    });

    after(function() {
      for (var i = 0; i < stubs.length; i++) {
        stubs[i].restore();
      }
    });

    // get with no parameters
    it ('should throw an error for no parameters', function() {
      expect(() => {
        new PreferencesClass(VALID_EXISTING_FILEPATH).get();
      }).to.not.throw(Error);
    });

    // get with null parameters

    // get with empty string

    // get with valid key but no preferences file

    // get with valid new key with preferences file

    // get with existing key with preferences file

    //
  });

  describe('Preferences.set()', function() {
    // var PreferencesClass = require('../src/models/preferences');

    //
  });
});
