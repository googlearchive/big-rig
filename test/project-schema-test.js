'use strict';

/* global describe, it */

var chai = require('chai');
var expect = chai.expect;
var chaiAsPromised = require('chai-as-promised');

// DataStore stuff.
var DataStore = require('../src/models/datastore');
var projectSchema = require('../src/models/schemas/project-schema');

var TEST_SCHEMA_PATH = '/src/models/schemas/';
var STORE_NAME = 'ProjectSchemaTestStore';

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
    var dataStore = new DataStore(STORE_NAME, TEST_SCHEMA_PATH);
    var modelData = {
    };
    var put = dataStore.put(projectSchema.collectionName, modelData);

    return expect(put).to.eventually.be.rejectedWith(
      Error, 'Validation failed'
    );
  });

  it ('reject if name is empty', function () {
    var dataStore = new DataStore(STORE_NAME, TEST_SCHEMA_PATH);
    var modelData = {
      name: ''
    };
    var put = dataStore.put(projectSchema.collectionName, modelData);

    return expect(put).to.eventually.be.rejectedWith(
      Error, 'Validation failed'
    );
  });

  it ('reject if name is null', function () {
    var dataStore = new DataStore(STORE_NAME, TEST_SCHEMA_PATH);
    var modelData = {
      name: null
    };
    var put = dataStore.put(projectSchema.collectionName, modelData);

    return expect(put).to.eventually.be.rejectedWith(
      Error, 'Validation failed'
    );
  });
  it ('reject if name is undefined', function () {
    var dataStore = new DataStore(STORE_NAME, TEST_SCHEMA_PATH);
    var modelData = {
      name: undefined
    };
    var put = dataStore.put(projectSchema.collectionName, modelData);

    return expect(put).to.eventually.be.rejectedWith(
      Error, 'Validation failed'
    );
  });
});
