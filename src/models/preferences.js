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

/**
 * Preferences is a simple class to read and write key, value pairs
 * to a file.
 *
 * @author: gauntface
 */
class Preferences {

  constructor(filepath) {
    if (!filepath) {
      throw new Error('Filepath parameter is invalid \'' + filepath + '\'');
    }

    if (filepath.substring(filepath.length - 1, filepath.length) === path.sep) {
      throw new Error('Filepath must end with a name for the file \'' +
        filepath + '\'');
    }

    this._filepath = filepath;
  }

  get(key) {
    return new Promise((resolve, reject) => {
      if (!key) {
        return reject('You must pass in a key name.');
      }

      fs.stat(this._filepath, (statErr, stats) => {
        if (!stats) {
          return resolve(null);
        }

        fs.readFile(this._filepath, (readErr, fileContents) => {
          if (readErr) {
            return reject(readErr);
          }

          let preferences = JSON.parse(fileContents);
          if (!preferences[key]) {
            return resolve(null);
          }

          return resolve(preferences[key]);
        });
      });
    });
  }

  set(key, value) {
    return new Promise((resolve, reject) => {
      if (!key) {
        return reject('You must provide a valid key');
      }

      mkdirp(path.dirname(this._filepath), (mkdirpErr) => {
        if (mkdirpErr) {
          return reject(mkdirpErr);
        }

        fs.stat(this._filepath, (statsErr, stats) => {
          let updatePreferences = (preferences) => {
            preferences[key] = value;

            fs.writeFile(this._filepath, JSON.stringify(preferences),
              (writeErr) => {
                if (writeErr) {
                  return reject(writeErr);
                }

                resolve();
              }
            );
          };

          if (!stats) {
            // File doesn't exist, so pass in blank preferences object
            return updatePreferences({}, key, value);
          }

          fs.readFile(this._filepath, (err, fileContents) => {
            if (err) {
              return reject(err);
            }
            updatePreferences(JSON.parse(fileContents));
          });
        });
      });
    });
  }
}

module.exports = Preferences;
