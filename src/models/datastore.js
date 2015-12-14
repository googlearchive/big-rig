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

let ModelFactory = require('../helpers/model-factory');
let Connection = require('./connection');

class DataStore {

  constructor () {
    this.storeName_ = null;
  }

  configure (opts) {
    if (typeof opts === 'undefined') {
      throw new Error('DataStore configuration not provided.');
    }

    this.storeName = opts.store || null;
    ModelFactory.modelData = opts.models || null;
  }

  get storeName () {
    return this.storeName_;
  }

  set storeName (storeName) {
    this.storeName_ = storeName;
  }

  get models () {
    return ModelFactory.modelData;
  }

  set models (modelData) {
    ModelFactory.modelData = modelData;
  }

  _ensureValidPopulations (populations) {
    // Assume missing.
    if (typeof populations === 'undefined' || populations === null) {
      return [];
    }

    // Assume string.
    if (typeof populations === 'string') {
      return [populations];
    }

    // Assume object.
    if (typeof populations.length === 'undefined') {
      return [populations];
    }

    // Assume array.
    return populations;
  }

  action_ (type, cb) {
    if (this.storeName === null) {
      return Promise.reject(new Error('Database name must be set.'));
    }

    let connection;

    return Connection

        // Get a connection.
        .getFromPool(this.storeName)

        // Store it so it can be released later.
        .then(conn => {
          connection = conn;
        })

        // Call the callback.
        .then(() => {
          let model = ModelFactory.get(type);

          if (model === null) {
            return Promise.reject(new Error('No model found for ' + type));
          }

          return cb(model);
        })

        // Propagate the result
        .then(result => {
          Connection.returnToPool(connection);
          return result;
        }).catch(err => {
          Connection.returnToPool(connection);
          throw err;
        });
  }

  put (type, data, id) {
    // If an array bounce it down to individual requests.
    if (Array.isArray(data)) {
      // Check that every item in the array is at least an object.
      if (!data.every(item => typeof item === 'object')) {
        return Promise.reject(
          new Error('put() given array of entries which are not all objects.')
        );
      }

      // Remap to an array of promises for each item.
      return Promise.all(data.map((item) => this.put(type, item)));
    }

    // Make sure that an object is passed.
    if (typeof data !== 'object') {
      return Promise.reject(new Error('put() requires an object.'));
    }

    // Check if the data is an existing model. If so, fail.
    if (typeof data._id === 'object' &&
        data._id.constructor.name === 'ObjectID') {
      return Promise.reject(new Error('put() cannot take an existing model.'));
    }

    return this.action_(type, (model) => {
      return new Promise((resolve, reject) => {
        // Assume it's a plain insert action.
        let conditions = data;

        // Unless we have an ID, in which case this is
        // an update, and we should flatten the search
        // criteria to just the ID of the existing doc.
        if (typeof id !== 'undefined') {
          conditions = {
            _id: id
          };
        }

        // Use upsert to insert instead of update if no record exists.
        // Also using the model-centric way to ensure any hooks get fired.
        model.findOneAndUpdate(conditions, data, {
          upsert: true
        },
          function (err) {
            if (err) {
              return reject(err);
            }

            resolve();
          });
      });
    });
  }

  getById (type, id, opts) {
    opts = opts || {};
    opts.criteria = {
      _id: id
    };

    return this.get(type, opts).then(rooms => rooms[0]);
  }

  get (type, opts) {
    opts = opts || {};
    let limit = opts.limit || null;
    let offset = opts.offset || null;
    let sort = opts.sort || null;
    let criteria = opts.criteria || {};
    let populations = this._ensureValidPopulations(opts.populate);

    return this.action_(type, (model) => {
      return new Promise((resolve, reject) => {
        // Make a query.
        let query = model.find(criteria);

        if (typeof sort === 'object') {
          query = query.sort(sort);
        }

        // Offset and limit if needed.
        if (typeof offset === 'number') {
          query = query.skip(offset);
        }

        if (typeof limit === 'number') {
          query = query.limit(limit);
        }

        // Expand any additional fields.
        populations.forEach(populate => {
          query = query.populate(populate);
        });

        query.exec((err, results) => {
          if (err) {
            return reject(err);
          }

          resolve(results);
        });
      });
    });
  }

  delete (type, id) {
    return this.action_(type, (model) => {
      return new Promise((resolve, reject) => {

        // Formulated this way so that schema hooks fire.
        model.findOne({
          _id: id
        }, (findErr, findResult) => {
          if (findErr) {
            return reject(findErr);
          }

          if (findResult === null) {
            return reject(new Error('Unable to find object with ID: ' + id));
          }

          findResult.remove((err, result) => {
            if (err) {
              return reject(err);
            }

            resolve(result);
          });
        });
      });
    });
  }

  aggregate (type, steps) {
    return this.action_(type, (model) => {
      return new Promise((resolve, reject) => {
        // Make a query.
        model.aggregate(steps, (err, results) => {
          if (err) {
            return reject(err);
          }

          resolve(results);
        });
      });
    });
  }
}

module.exports = new DataStore();
