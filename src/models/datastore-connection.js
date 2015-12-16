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
let SchemaHelper = require('../helpers/schema-helper');

class DataStoreConnection {

  static getFromPool (storeName) {
    if (typeof storeName === 'undefined' || storeName === null) {
      throw new Error('No store name provided.');
    }

    let url = DataStoreConnection.URL + storeName;

    return new Promise((resolve, reject) => {
      let db = mongoose.createConnection(url);
      db.on('error', (err) => {
        throw err;
      });
      db.on('open', () => {
        // Update all the schemas to use this connection.
        SchemaHelper.connectAll(db);
        resolve(db);
      });
    });
  }

  static returnToPool (db) {
    // Remove all connected instances of the schemas.
    SchemaHelper.disconnectAll();
    return new Promise((resolve, reject) => {
      db.close( () => {
        resolve();
      });
    });
  }

  static get URL () {
    return 'mongodb://localhost/';
  }
}

module.exports = DataStoreConnection;
