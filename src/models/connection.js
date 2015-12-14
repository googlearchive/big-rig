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

let mongoose = require('mongoose');
let ModelFactory = require('../helpers/model-factory');

class Connection {

  static getFromPool (databaseName) {
    if (typeof databaseName === 'undefined' || databaseName === null) {
      throw 'No database name provided.';
    }

    let url = Connection.URL + databaseName;

    return new Promise((resolve, reject) => {
      let db = mongoose.createConnection(url);
      db.on('error', (err) => {
        throw err;
      });
      db.on('open', () => {
        // Update all the models to use this connection.
        ModelFactory.connectAll(db);
        resolve(db);
      });
    });
  }

  static returnToPool (db) {
    // Remove all connected instances of the models.
    ModelFactory.disconnectAll();
    db.close();
  }

  static get URL () {
    return 'mongodb://localhost/';
  }
}

module.exports = Connection;
