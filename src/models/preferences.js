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

var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');

class Preferences {

  constructor(filepath) {
    if (!filepath) {
      throw new Error('Filepath parameter is invalid \'' + filepath + '\'');
    }

    if (path.isAbsolute(filepath)) {
      throw new Error('Filepath must not be absolute \'' + filepath + '\'');
    }

    if (filepath.substring(filepath.length - 1, filepath.length) === path.sep) {
      throw new Error('Filepath must end with a name for the file \'' +
        filepath + '\'');
    }

    this._filepath = filepath;
  }

  get(key) {
    if (!key) {
      throw new Error('You must pass in a key name.');
    }

    if (!fs.existsSync(this._filepath)) {
      return null;
    }

    let preferences = JSON.parse(fs.readFileSync(this._filepath));
    if (!preferences[key]) {
      return null;
    }

    return preferences[key];
  }

  set(key, value) {
    if (!key) {
      throw new Error('You must provide a valid key');
    }
    mkdirp.sync(path.dirname(this._filepath));

    var preferences = {};

    if (fs.existsSync(this._filepath)) {
      preferences = JSON.parse(fs.readFileSync(this._filepath));
    }

    preferences[key] = value;

    fs.writeFileSync(this._filepath, JSON.stringify(preferences));
  }
}

module.exports = Preferences;
