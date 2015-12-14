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

class ModelFactory {

  constructor () {
    this.models = null;
    this.modelKeys = null;
  }

  get modelData () {
    return this.models;
  }

  set modelData (models) {
    if (models === null) {
      throw new Error('Models is null');
    }

    this.models = models;
    this.modelKeys = Object.keys(this.models);
  }

  connectAll (connection) {
    if (this.models === null) {
      throw new Error('No models provided.');
    }

    let model;

    this.modelKeys.forEach((modelType) => {
      model = this.models[modelType];
      model.instance = model.factory(connection);
    });
  }

  disconnectAll () {
    this.modelKeys.forEach((modelType) => {
      this.models[modelType].instance = null;
    });
  }

  exists (type) {
    return (typeof this.models[type] !== 'undefined');
  }

  get (type) {
    if (typeof type === 'undefined') {
      throw new Error('Model type not provided.');
    }

    if (typeof this.models[type] === 'undefined') {
      throw new Error('Unknown model type provided: ' + type);
    }

    if (typeof this.models[type].instance !== 'undefined') {
      return this.models[type].instance;
    }

    return null;
  }
}

module.exports = new ModelFactory();
