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

/* global describe, it */

let chai = require('chai');
let expect = chai.expect;
let chaiAsPromised = require('chai-as-promised');

// DataStore stuff.
let DataStore = require('../src/models/datastore');
let projectSchema = require('../src/models/schemas/project-schema');

let TEST_SCHEMA_PATH = '/src/models/schemas/';
let STORE_NAME = 'ProjectSchemaTestStore';

chai.use(chaiAsPromised);

describe('Test Project Schema', () => {
  // Delete the test store contents directly each time.
  afterEach(function (done) {
    let mongoose = require('mongoose');
    mongoose.connect('mongodb://localhost/' + STORE_NAME, function () {
      mongoose.connection.db.dropDatabase();
      mongoose.disconnect();
      done();
    });
  });

  it ('reject if no data is defined', function () {
    let dataStore = new DataStore(STORE_NAME, TEST_SCHEMA_PATH);
    let modelData = {
    };
    let put = dataStore.put(projectSchema.collectionName, modelData);

    return expect(put).to.eventually.be.rejectedWith(
      Error, 'ProjectSchema validation failed'
    );
  });

  it ('reject if name is empty', function () {
    let dataStore = new DataStore(STORE_NAME, TEST_SCHEMA_PATH);
    let modelData = {
      name: ''
    };
    let put = dataStore.put(projectSchema.collectionName, modelData);

    return expect(put).to.eventually.be.rejectedWith(
      Error, 'ProjectSchema validation failed'
    );
  });

  it ('reject if name is null', function () {
    let dataStore = new DataStore(STORE_NAME, TEST_SCHEMA_PATH);
    let modelData = {
      name: null
    };
    let put = dataStore.put(projectSchema.collectionName, modelData);

    return expect(put).to.eventually.be.rejectedWith(
      Error, 'ProjectSchema validation failed'
    );
  });

  it ('reject if name is undefined', function () {
    let dataStore = new DataStore(STORE_NAME, TEST_SCHEMA_PATH);
    let modelData = {
      name: undefined
    };
    let put = dataStore.put(projectSchema.collectionName, modelData);

    return expect(put).to.eventually.be.rejectedWith(
      Error, 'ProjectSchema validation failed'
    );
  });

  it ('should save project', function () {
    let dataStore = new DataStore(STORE_NAME, TEST_SCHEMA_PATH);
    let modelData = {
      name: 'Valid Project Name'
    };
    let put = dataStore.put(projectSchema.collectionName, modelData);

    return expect(put).to.eventually.be.fulfilled;
  });
});
