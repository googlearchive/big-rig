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
var path = require('path');
var fs = require('fs');
var rimraf = require('rimraf');
var ncp = require('ncp');

// This is a test and want descriptions to be useful, if this
// breaks the max-length, it's ok.

/* eslint-disable max-len */

var testOutputPath = path.join(__dirname, './test-output/');
var PreferencesClass = require('../src/models/preferences');

describe('models.Preferences', function() {
  var VALID_NEW_FILEPATH = path.join(testOutputPath, '/new-preferences/new-preferences.json');
  var VALID_EXISTING_FILEPATH = path.join(testOutputPath, '/existing-preferences.json');

  var VALID_EXISTING_KEY = 'key1';
  var EXISTING_VALUE = 'value1';

  var VALID_NEW_KEY = 'valid-new-key';
  var NEW_VALUE = 'valid-new-value';

  /**
   * Since preferences writes new values and value changes to file
   * we need to copy over a new set of data for each test return
   */
  beforeEach(function(done) {
    ncp(path.join(__dirname, '/data/preferences/'), testOutputPath,
      function(err) {
        done();
      });
  });

  afterEach(function(done) {
    rimraf(testOutputPath, done);
  });

  describe('new Preferences()', function() {
    var INVALID_NO_FILENAME_FILEPATH = path.join(testOutputPath, '/preferences/no-filename/');

    it ('should throw an error due to no parameters', function() {
      expect(() => {
        new PreferencesClass();
      }).to.throw(Error);
    });

    it ('should throw an error due to parameters being null', function() {
      expect(() => {
        new PreferencesClass(null);
      }).to.throw(Error);
    });

    it ('should throw an error due to parameter being an empty string', function() {
      expect(() => {
        new PreferencesClass('');
      }).to.throw(Error);
    });

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
    it ('should throw an error for no parameters', function(done) {
      new PreferencesClass(VALID_EXISTING_FILEPATH).get()
      .then(function() {
        done(new Error());
      })
      .catch(function(err) {
        done();
      });
    });

    it ('should throw an error for null parameter', function(done) {
      new PreferencesClass(VALID_EXISTING_FILEPATH).get(null)
      .then(function() {
        done(new Error());
      })
      .catch(function(err) {
        done();
      });
    });

    it ('should throw an error for empty string parameter', function(done) {
      new PreferencesClass(VALID_EXISTING_FILEPATH).get('')
      .then(function() {
        done(new Error());
      })
      .catch(function(err) {
        done();
      });
    });

    it ('should return null for a new preferences file requesting a new key', function(done) {
      new PreferencesClass(VALID_NEW_FILEPATH).get(VALID_NEW_KEY)
      .then(function(value) {
        expect(value).to.equal(null);
        done();
      })
      .catch(function(err) {
        done(new Error(err));
      });
    });

    it ('should return null for existing preferences file with a new key', function(done) {
      new PreferencesClass(VALID_EXISTING_FILEPATH).get(VALID_NEW_KEY)
      .then(function(value) {
        expect(value).to.equal(null);
        done();
      })
      .catch(function(err) {
        done(new Error(err));
      });
    });

    it ('should return the existing value for the existing key in the existing preferences file', function(done) {
      new PreferencesClass(VALID_EXISTING_FILEPATH).get(VALID_EXISTING_KEY)
      .then(function(value) {
        expect(value).to.equal(EXISTING_VALUE);
        done();
      })
      .catch(function(err) {
        done(new Error(err));
      });
    });
  });

  describe('Preferences.set()', function() {
    it ('should throw an error for no parameters', function(done) {
      new PreferencesClass(VALID_EXISTING_FILEPATH).set()
      .then(function() {
        done(new Error());
      })
      .catch(function() {
        done();
      });
    });

    // set with null parameters
    it ('should throw an error for null parameters', function(done) {
      new PreferencesClass(VALID_EXISTING_FILEPATH).set(null, null)
      .then(function() {
        done(new Error());
      })
      .catch(function() {
        done();
      });
    });

    // set with empty key parameter
    it ('should throw an error for empty string for key parameter', function(done) {
      new PreferencesClass(VALID_EXISTING_FILEPATH).set(null, NEW_VALUE)
      .then(function() {
        done(new Error());
      })
      .catch(function() {
        done();
      });
    });

    // set new value to new preferences file
    it ('should create new folder and should write new value to new file', function(done) {
      /** var writeCallback = function(filepath, value) {
        var preferences = JSON.parse(value);
        expect(filepath).to.equal(VALID_NEW_FILEPATH);
        expect(preferences[VALID_NEW_KEY]).to.equal(NEW_VALUE);

        done();
      };**/
      new PreferencesClass(VALID_NEW_FILEPATH).set(VALID_NEW_KEY, NEW_VALUE)
      .then(function() {
        var fileContents = fs.readFileSync(VALID_NEW_FILEPATH);
        var preferences = JSON.parse(fileContents);
        expect(preferences[VALID_NEW_KEY]).to.equal(NEW_VALUE);
        done();
      })
      .catch(function(err) {
        done(new Error(err));
      });
    });

    // set new value for new key to existing preferences file
    it ('should assign to new value to existing preferences file', function(done) {
      /** var writeCallback = function(filepath, value) {
        var preferences = JSON.parse(value);
        expect(filepath).to.equal(VALID_EXISTING_FILEPATH);
        expect(preferences[VALID_NEW_KEY]).to.equal(NEW_VALUE);

        done();
      };**/

      new PreferencesClass(VALID_EXISTING_FILEPATH).set(VALID_NEW_KEY, NEW_VALUE)
      .then(function() {
        var fileContents = fs.readFileSync(VALID_EXISTING_FILEPATH);
        var preferences = JSON.parse(fileContents);
        expect(preferences[VALID_NEW_KEY]).to.equal(NEW_VALUE);
        done();
      })
      .catch(function(err) {
        done(new Error(err));
      });
    });

    // set new value for existing key to existing preferences file
    it ('should assign to new value to existing key to existing preferences file', function(done) {
      /** var writeCallback = function(filepath, value) {
        var preferences = JSON.parse(value);
        expect(filepath).to.equal(VALID_EXISTING_FILEPATH);
        expect(preferences[VALID_EXISTING_KEY]).to.equal(NEW_VALUE);

        done();
      };**/

      new PreferencesClass(VALID_EXISTING_FILEPATH).set(VALID_EXISTING_KEY, NEW_VALUE)
      .then(function() {
        var fileContents = fs.readFileSync(VALID_EXISTING_FILEPATH);
        var preferences = JSON.parse(fileContents);
        expect(preferences[VALID_EXISTING_KEY]).to.equal(NEW_VALUE);
        done();
      })
      .catch(function(err) {
        done(new Error(err));
      });
    });
  });
});
