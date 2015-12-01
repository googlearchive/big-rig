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

var mysql = require('mysql');

var Preferences = require('./preferences');
var ParamValidator = require('./../helpers/param-validator');

var path = require('path');

/**
 * This model handles the saving of database config (i.e. username,
 * password, port etc) as well as opening up connections to the database.
 * The getConfig method is useful for populate settings pages etc with
 * the current data
 *
 * @author: gauntface
 */
class DatabaseModel {

  constructor (preferencesPath) {
    if (!preferencesPath) {
      preferencesPath = path.join(
        process.cwd(), '/.config/', 'db-config.json');
    }
    this.preferences = new Preferences(preferencesPath);
  }

  saveConfig (config) {
    return new Promise((resolve) => {
      if ((typeof config) === 'undefined' || config === null) {
        throw new Error('Undefined config');
      }

      let requiredParameters = [
        {
          name: 'host',
          type: 'string'
        },
        {
          name: 'port',
          type: 'number'
        },
        {
          name: 'user',
          type: 'string'
        },
        {
          name: 'password',
          type: 'string'
        },
        {
          name: 'database',
          type: 'string'
        }
      ];
      ParamValidator.validateParameters(config, requiredParameters);

      // Test connection before it's saved
      let connection = mysql.createConnection(config);
      connection.connect((err) => {
        if (err) {
          throw new Error('Invalid database details.');
        }

        this.preferences.set('db-config', config)
        .then(() => {
          connection.end();
          resolve();
        });
      });
    });
  }

  getConfig () {
    return this.preferences.get('db-config');
  }

  open () {
    return this.getConfig()
      .then((config) => {
        if (!config) {
          throw new Error('No database configuration.');
        }

        var connection = mysql.createConnection(config);
        return new Promise((resolve) => {
          connection.query('USE ' + config.database, (err) => {
            if (err) {
              throw err;
            }

            resolve(connection);
          });
        });
      });
  }
}

module.exports = DatabaseModel;
