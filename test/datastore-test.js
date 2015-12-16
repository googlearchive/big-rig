'use strict';

/* global describe, it */

var chai = require('chai');
var expect = chai.expect;
var chaiAsPromised = require('chai-as-promised');

// DataStore stuff.
var DataStore = require('../src/models/datastore');
var schemas = require('./data/schemas/schemas');
var STORE_NAME = 'TestStore';

chai.use(chaiAsPromised);

describe('models.DataStore', function () {
  // Basic setup.
  describe('DataStore.configure', function () {
    it ('throws if no config is given', function () {
      function createStore () {
        new DataStore();
      }

      return expect(createStore).to.throw(
        Error, 'Store name must be provided.'
      );
    });
  });

  // Put.
  describe('DataStore.put', function () {
    // Delete the test store contents directly each time.
    afterEach(function (done) {
      let mongoose = require('mongoose');
      mongoose.connect('mongodb://localhost/' + STORE_NAME, function () {
        mongoose.connection.db.dropDatabase();
        mongoose.disconnect();
        done();
      });
    });

    it ('rejects if no type is given', function () {
      var dataStore = new DataStore(STORE_NAME, schemas);
      var put = dataStore.put(undefined, {});

      return expect(put).to.eventually.be.rejectedWith(
        Error, 'put() requires type as a string.'
      );
    });

    it ('rejects if unknown type is given', function () {
      var dataStore = new DataStore(STORE_NAME, schemas);
      var put = dataStore.put('person', {});

      return expect(put).to.eventually.be.rejectedWith(
        Error, 'Unknown schema type provided: person.'
      );
    });

    it ('rejects if no data is given', function () {
      var dataStore = new DataStore(STORE_NAME, schemas);
      var put = dataStore.put(schemas.TestSchema.collectionName, undefined);

      return expect(put).to.eventually.be.rejectedWith(
        Error, 'put() requires data as an object.'
      );
    });

    it ('rejects if data is not an object (requires)', function () {
      var dataStore = new DataStore(STORE_NAME, schemas);
      var put = dataStore.put(schemas.TestNoRequireSchema.collectionName, 1);

      return expect(put).to.eventually.be.rejectedWith(
        Error, 'put() requires data as an object.'
      );
    });

    it ('rejects if data is an array with no objects', function () {
      var dataStore = new DataStore(STORE_NAME, schemas);
      var put = dataStore.put(schemas.TestNoRequireSchema.collectionName, [1, {
        name: 'modelData'
      }]);

      return expect(put).to.eventually.be.rejectedWith(
        Error, 'put() given array of entries which are not all objects.'
      );
    });

    it ('rejects if data contains an empty property', function () {
      var modelData = {
        name: 'Test Record'
      };

      // This attempts to write to the root object, causing MongoDB to fail.
      modelData[''] = '';

      var dataStore = new DataStore(STORE_NAME, schemas);
      var put = dataStore.put(schemas.TestNoRequireSchema.collectionName,
          modelData);

      return expect(put).to.eventually.be.rejectedWith(
        'put() does not allow any empty keys on the data object'
      );
    });

    it ('rejects if given an existing model', function () {
      var modelData = {
        name: 'Test Record'
      };

      // Write the content to the MongoDB database without the abstraction.
      return new Promise(function (resolve, reject) {
        var mongoose = require('mongoose');
        var db = mongoose
            .createConnection('mongodb://localhost/' + STORE_NAME);

        db.on('open', function () {
          var Schema = schemas.TestSchema.factory(db);
          var model = new Schema(modelData);

          model.save(function (err, result) {
            if (err) {
              throw err;
            }

            db.close(function () {
              resolve(result);
            });
          });
        });
      }).then(function (newInstance) {
        newInstance.name = 'testNameUpdated';
        var dataStore = new DataStore(STORE_NAME, schemas);
        var put = dataStore.put(schemas.TestSchema.collectionName, newInstance);

        return expect(put).to.be.rejectedWith(
          Error, 'put() cannot take an existing schema.'
        );
      });
    });

    it ('creates a new document', function () {
      var dataStore = new DataStore(STORE_NAME, schemas);
      var modelData = {
        name: 'testName'
      };

      return dataStore.put(schemas.TestSchema.collectionName, modelData)
        .then(function () {
          // Check that the data stored correctly by going to the database
          // directly and pulling the record.
          return new Promise(function (resolve, reject) {
            var mongoose = require('mongoose');
            var db = mongoose
                .createConnection('mongodb://localhost/' + STORE_NAME);

            db.on('open', function () {
              // Instantiate the schema for the connection.
              var model = schemas.TestSchema.factory(db);

              model.find(modelData, function (err, result) {
                if (err) {
                  throw err;
                }

                db.close(function () {
                  resolve(result[0]);
                });
              });
            });
          });
        }).then(function (retrievedInstance) {
          return expect(retrievedInstance.name).to.equal(modelData.name);
        });
    });

    it ('updates an existing document\'s simple property', function () {
      var modelData = {
        name: 'testName'
      };
      var originalInstance;

      // First store the data directly.
      return new Promise(function (resolve, reject) {
        var mongoose = require('mongoose');
        var db = mongoose
                .createConnection('mongodb://localhost/' + STORE_NAME);

        db.on('open', function () {
          var Schema = schemas.TestSchema.factory(db);
          var model = new Schema(modelData);

          model.save(function (err, result) {
            if (err) {
              throw err;
            }

            db.close(function () {
              resolve(result);
            });
          });
        });
      })

      // Then use the abstraction to pull it from the store, and update it.
      .then(function (newInstance) {
        originalInstance = newInstance;

        var dataStore = new DataStore(STORE_NAME, schemas);
        return dataStore.put(schemas.TestSchema.collectionName, {
          name: 'testNameUpdated'
        }, newInstance._id);
      })

      // Go direct to pull it a second time and check that it's updated.
      .then(function () {
        return new Promise(function (resolve, reject) {
          var mongoose = require('mongoose');
          var db = mongoose
                .createConnection('mongodb://localhost/' + STORE_NAME);

          db.on('open', function () {
            var schema = schemas.TestSchema.factory(db);

            schema.find({
              name: 'testNameUpdated'
            }, function (err, result) {
              if (err) {
                throw err;
              }

              db.close(function () {
                resolve(result[0]);
              });
            });
          });
        });
      })

      // Check that the values match.
      .then(function (updatedInstance) {
        // Check this is still the same object.
        var updatedInstanceID = updatedInstance._id.toString();
        var originalInstanceID = originalInstance._id.toString();

        expect(updatedInstanceID).to.equal(originalInstanceID);

        // But that it has a new name.
        return expect(updatedInstance.name).to.equal('testNameUpdated');
      });
    });

    it ('updates an existing document\'s populated property', function () {
      var modelData = {
        name: 'Test Record'
      };
      var altModelData = {
        name: 'Alternate Test Record'
      };
      var testReferrerObject = {
        name: 'Record that refers to Test or Alt Test'
      };

      var insertedInstances;

      // Start by inserting the Test and Alt Test records directly.
      return new Promise(function (resolve, reject) {
        var mongoose = require('mongoose');
        var db = mongoose
                .createConnection('mongodb://localhost/' + STORE_NAME);

        db.on('open', function () {
          var Schema = schemas.TestSchema.factory(db);

          // Store the test and alt objects.
          Schema.create([modelData, altModelData],
            function (err, result) {
              if (err) {
                throw err;
              }

              db.close(function () {
                resolve(result);
              });
            });
        });
      })

      // Now insert the Referrer record...
      .then(function (newInstances) {
        insertedInstances = newInstances;

        return new Promise(function (resolve, reject) {
          var mongoose = require('mongoose');
          var db = mongoose
                .createConnection('mongodb://localhost/' + STORE_NAME);

          db.on('open', function () {
            var Schema = schemas.TestReferrerSchema.factory(db);

            // Set the referrer to point to  Test.
            testReferrerObject._test = insertedInstances[0]._id;

            var model = new Schema(testReferrerObject);
            model.save(function (err, result) {
              if (err) {
                throw err;
              }

              db.close(function () {
                resolve(result);
              });
            });
          });
        });
      })


      // Update the referring test to point to the Alt Test,
      // using the abstraction.
      .then(function (testRefObject) {
        var dataStore = new DataStore(STORE_NAME, schemas);

        return dataStore.put(schemas.TestReferrerSchema.collectionName, {
          _test: insertedInstances[1]._id
        }, testRefObject._id);
      })

      // Now go direct and check that the populated version points to Alt Test.
      .then(function () {
        return new Promise(function (resolve, reject) {
          var mongoose = require('mongoose');
          var db = mongoose
                .createConnection('mongodb://localhost/' + STORE_NAME);

          db.on('open', function () {
            // Register the Test Schema for this connection so it can be
            // populated as part of the query.
            schemas.TestSchema.factory(db);

            var Schema = schemas.TestReferrerSchema.factory(db);

            Schema
              .find()
              .populate('_test')
              .exec(function (err, result) {
                if (err) {
                  throw err;
                }

                db.close(function () {
                  resolve(result[0]);
                });
              });
          });
        });
      }).then(function (record) {
        return expect(record._test.name).to.equal(altModelData.name);
      });
    });

    it ('can bulk insert multiple records', function () {
      var modelData = [
        {
          name: 'record1', createdAt: new Date(2011, 1, 3)
        },
        {
          name: 'record2', createdAt: new Date(2012, 1, 3)
        },
        {
          name: 'record3', createdAt: new Date(2013, 1, 3)
        }
      ];

      var dataStore = new DataStore(STORE_NAME, schemas);

      return dataStore.put(schemas.TestSchema.collectionName, modelData)
        .then(function () {
          return new Promise(function (resolve, reject) {
            var mongoose = require('mongoose');
            var db = mongoose
                .createConnection('mongodb://localhost/' + STORE_NAME);

            db.on('open', function () {
              var model = schemas.TestSchema.factory(db);

              model.find(function (err, results) {
                if (err) {
                  throw err;
                }

                db.close(function () {
                  resolve(results);
                });
              });
            });
          });
        }).then(function (instances) {
          expect(instances).to.be.instanceof(Array);
          expect(instances).to.have.length(3);

          return expect(instances.reduce(function (count, value) {
            if (value.name.indexOf('record') >= 0) {
              count++;
            }

            return count;
          }, 0)).to.equal(3);
        });
    });
  });

  // Get.
  describe('DataStore.get', function () {
    // Delete the test store contents directly each time.
    afterEach(function (done) {
      let mongoose = require('mongoose');
      mongoose.connect('mongodb://localhost/' + STORE_NAME, function () {
        mongoose.connection.db.dropDatabase();
        mongoose.disconnect();
        done();
      });
    });

    it ('rejects if no type is given', function () {
      var dataStore = new DataStore(STORE_NAME, schemas);

      return expect(dataStore.get()).to.eventually.be.rejectedWith(
        Error, 'Schema type not provided.'
      );
    });

    it ('returns an empty array when there are no records', function () {
      var dataStore = new DataStore(STORE_NAME, schemas);
      var getAll = dataStore.get(schemas.TestSchema.collectionName);

      return Promise.all([
        expect(getAll).to.eventually.be.instanceof(Array),
        expect(getAll).to.eventually.have.length(0)
      ]);
    });

    it ('rejects when given a garbage query', function () {
      var dataStore = new DataStore(STORE_NAME, schemas);
      var getAll = dataStore.get('wobblejobble');

      return expect(getAll).to.eventually.be.rejectedWith(
        Error, 'Unknown schema type provided: wobblejobble'
      );
    });

    it ('returns an array of records', function () {
      var modelData = {
        name: 'Test Record'
      };

      return new Promise(function (resolve, reject) {
        var mongoose = require('mongoose');
        var db = mongoose
                .createConnection('mongodb://localhost/' + STORE_NAME);

        db.on('open', function () {
          var Schema = schemas.TestSchema.factory(db);

          var model = new Schema(modelData);
          model.save(function (err, result) {
            if (err) {
              throw err;
            }

            db.close(function () {
              resolve(result);
            });
          });
        });
      }).then(function (newInstance) {
        var dataStore = new DataStore(STORE_NAME, schemas);
        var getAll = dataStore.get(schemas.TestSchema.collectionName);

        return Promise.all([
          expect(getAll).to.eventually.be.instanceof(Array),
          expect(getAll).to.eventually.have.length(1),
          expect(getAll.then(function (results) {
            return results[0].name;
          })).to.eventually.equal(modelData.name)
        ]);
      });
    });

    it ('sorts ascending', function () {
      var modelData = [
        {
          name: 'record1', createdAt: new Date(2011, 1, 3)
        },
        {
          name: 'record2', createdAt: new Date(2012, 1, 3)
        },
        {
          name: 'record3', createdAt: new Date(2013, 1, 3)
        }
      ];

      // Store the data directly
      return new Promise(function (resolve, reject) {
        var mongoose = require('mongoose');
        var db = mongoose
                .createConnection('mongodb://localhost/' + STORE_NAME);

        db.on('open', function () {
          var Schema = schemas.TestSchema.factory(db);

          Schema.create(modelData, function (err, result) {
            if (err) {
              throw err;
            }

            db.close(function () {
              resolve(result);
            });
          });
        });
      })
      .then(function () {
        var dataStore = new DataStore(STORE_NAME, schemas);
        var getAll = dataStore.get(schemas.TestSchema.collectionName, {
          sort: {
            createdAt: 1
          }
        });

        return Promise.all([
          expect(getAll).to.eventually.be.instanceof(Array),
          expect(getAll).to.eventually.have.length(3),
          expect(getAll.then(function (results) {
            return results[0].name;
          })).to.eventually.equal(modelData[0].name)
        ]);
      });
    });

    it ('sorts descending', function () {
      var modelData = [
        {
          name: 'record1', createdAt: new Date(2011, 1, 3)
        },
        {
          name: 'record2', createdAt: new Date(2012, 1, 3)
        },
        {
          name: 'record3', createdAt: new Date(2013, 1, 3)
        }
      ];

      // Store the data directly.
      return new Promise(function (resolve, reject) {
        var mongoose = require('mongoose');
        var db = mongoose
                .createConnection('mongodb://localhost/' + STORE_NAME);

        db.on('open', function () {
          var Schema = schemas.TestSchema.factory(db);

          Schema.create(modelData, function (err, result) {
            if (err) {
              throw err;
            }

            db.close(function () {
              resolve(result);
            });
          });
        });
      })
      .then(function () {
        var dataStore = new DataStore(STORE_NAME, schemas);
        var getAll = dataStore.get(schemas.TestSchema.collectionName, {
          sort: {
            createdAt: -1
          }
        });

        return Promise.all([
          expect(getAll).to.eventually.be.instanceof(Array),
          expect(getAll).to.eventually.have.length(3),
          expect(getAll.then(function (results) {
            return results[0].name;
          })).to.eventually.equal(modelData[2].name)
        ]);
      });
    });

    it ('offsets and limits the records if needed', function () {
      var modelData = [
        {
          name: 'record1', createdAt: new Date(2011, 1, 3)
        },
        {
          name: 'record2', createdAt: new Date(2012, 1, 3)
        },
        {
          name: 'record3', createdAt: new Date(2013, 1, 3)
        }
      ];

      // Store the data directly.
      return new Promise(function (resolve, reject) {
        var mongoose = require('mongoose');
        var db = mongoose
                .createConnection('mongodb://localhost/' + STORE_NAME);

        db.on('open', function () {
          var Schema = schemas.TestSchema.factory(db);

          Schema.create(modelData, function (err, result) {
            if (err) {
              throw err;
            }

            db.close(function () {
              resolve(result);
            });
          });
        });
      })
      .then(function () {
        var dataStore = new DataStore(STORE_NAME, schemas);
        var getAll = dataStore.get(schemas.TestSchema.collectionName, {
          limit: 1,
          offset: 1,
          sort: {
            createdAt: 1
          }
        });

        return Promise.all([
          expect(getAll).to.eventually.be.instanceof(Array),
          expect(getAll).to.eventually.have.length(1),
          expect(getAll.then(function (results) {
            return results[0].name;
          })).to.eventually.equal(modelData[1].name)
        ]);
      });
    });

    it ('gets by ID (array)', function () {
      var modelData = {
        name: 'testName'
      };

      return new Promise(function (resolve, reject) {
        var mongoose = require('mongoose');
        var db = mongoose
                .createConnection('mongodb://localhost/' + STORE_NAME);

        db.on('open', function () {
          var Schema = schemas.TestSchema.factory(db);

          var model = new Schema(modelData);
          model.save(function (err, result) {
            if (err) {
              throw err;
            }

            db.close(function () {
              resolve(result);
            });
          });
        });
      }).then(function (newInstance) {
        var dataStore = new DataStore(STORE_NAME, schemas);
        var get = dataStore.get(schemas.TestSchema.collectionName, {
          criteria: {
            _id: newInstance._id
          }
        });

        return Promise.all([
          expect(get).to.eventually.be.instanceof(Array),
          expect(get).to.eventually.have.length(1),
          expect(get.then(function (results) {
            return results[0].name;
          })).to.eventually.equal(modelData.name)
        ]);
      });
    });

    it ('gets by ID (convenience method, single object)', function () {
      var modelData = {
        name: 'testName'
      };

      return new Promise(function (resolve, reject) {
        var mongoose = require('mongoose');
        var db = mongoose
                .createConnection('mongodb://localhost/' + STORE_NAME);

        db.on('open', function () {
          var Schema = schemas.TestSchema.factory(db);

          var model = new Schema(modelData);
          model.save(function (err, result) {
            if (err) {
              throw err;
            }

            db.close(function () {
              resolve(result);
            });
          });
        });
      }).then(function (newInstance) {
        var dataStore = new DataStore(STORE_NAME, schemas);
        var getById = dataStore
          .getById(schemas.TestSchema.collectionName, newInstance._id)
          .then(function (result) {
            return result.name;
          });

        return expect(getById).to.eventually.equal(modelData.name);
      });
    });

    it ('populates a record', function () {
      var modelData = {
        name: 'Test Record'
      };

      var testReferrerObject = {
        name: 'Test Record Referrer'
      };

      // Insert the Test directly.
      return new Promise(function (resolve, reject) {
        var mongoose = require('mongoose');
        var db = mongoose
                .createConnection('mongodb://localhost/' + STORE_NAME);

        db.on('open', function () {
          var Schema = schemas.TestSchema.factory(db);

          var model = new Schema(modelData);
          model.save(function (err, result) {
            if (err) {
              throw err;
            }

            db.close(function () {
              resolve(result);
            });
          });
        });
      })

      // Insert the Test Referrer directly, and make it point to Test.
      .then(function (newInstance) {
        return new Promise(function (resolve, reject) {
          var mongoose = require('mongoose');
          var db = mongoose
                .createConnection('mongodb://localhost/' + STORE_NAME);

          db.on('open', function () {
            var Schema = schemas.TestReferrerSchema.factory(db);

            // Set the test to point to the new instance.
            testReferrerObject._test = newInstance._id;

            var model = new Schema(testReferrerObject);
            model.save(function (err, result) {
              if (err) {
                throw err;
              }

              db.close(function () {
                resolve(result);
              });
            });
          });
        });
      }).then(function () {
        var dataStore = new DataStore(STORE_NAME, schemas);
        var get = dataStore.get(schemas.TestReferrerSchema.collectionName, {
          populate: '_test'
        });

        return Promise.all([
          expect(get).to.eventually.be.instanceof(Array),
          expect(get).to.eventually.have.length(1),
          expect(get.then(function (results) {
            return results[0]._test.name;
          })).to.eventually.equal(modelData.name)
        ]);
      });
    });
  });

  // Delete.
  describe('DataStore.delete', function () {
    // Delete the test store contents directly each time.
    afterEach(function (done) {
      let mongoose = require('mongoose');
      mongoose.connect('mongodb://localhost/' + STORE_NAME, function () {
        mongoose.connection.db.dropDatabase();
        mongoose.disconnect();
        done();
      });
    });

    it ('rejects when a non-existent ID is given', function () {
      var ID = '56695059b5333b7d7573ffbf';
      var dataStore = new DataStore(STORE_NAME, schemas);
      var del = dataStore.delete(schemas.TestSchema.collectionName, ID);
      return expect(del).to.eventually.rejectedWith(
        Error, 'Unable to find object with ID: ' + ID
      );
    });

    it ('deletes an object', function () {
      var modelData = {
        name: 'testName'
      };

      return new Promise(function (resolve, reject) {
        var mongoose = require('mongoose');
        var db = mongoose
                .createConnection('mongodb://localhost/' + STORE_NAME);

        db.on('open', function () {
          var Schema = schemas.TestSchema.factory(db);

          var model = new Schema(modelData);
          model.save(function (err, result) {
            if (err) {
              throw err;
            }

            db.close(function () {
              resolve(result);
            });
          });
        });
      }).then(function (newInstance) {
        var dataStore = new DataStore(STORE_NAME, schemas);
        var deleteAndGet =
          dataStore
            .delete(schemas.TestSchema.collectionName, newInstance._id)
            .then(function () {
              return dataStore.get(schemas.TestSchema.collectionName);
            });

        return Promise.all([
          expect(deleteAndGet).to.eventually.be.instanceof(Array),
          expect(deleteAndGet).to.eventually.have.length(0)
        ]);
      });
    });
  });

  // Aggregate
  describe('DataStore.aggregate', function () {
    // Delete the test store contents directly each time.
    afterEach(function (done) {
      let mongoose = require('mongoose');
      mongoose.connect('mongodb://localhost/' + STORE_NAME, function () {
        mongoose.connection.db.dropDatabase();
        mongoose.disconnect();
        done();
      });
    });

    it ('aggregates data', function () {
      var modelData = [];
      var size = 100;

      // Create 100 records.
      for (var i = 0; i < size; i++) {
        modelData.push({
          name: ('record' + i),
          createdAt: new Date(2015, (i % 12), 1),
          value: (i + 1)
        });
      }

      return new Promise(function (resolve, reject) {
        var mongoose = require('mongoose');
        var db = mongoose
                .createConnection('mongodb://localhost/' + STORE_NAME);

        db.on('open', function () {
          var Schema = schemas.TestSchema.factory(db);

          Schema.create(modelData, function (err, result) {
            if (err) {
              throw err;
            }

            db.close(function () {
              resolve(result);
            });
          });
        });
      })
      .then(function () {
        var steps = [{

          $group: {
            _id: 1,
            avgValue: {
              $avg: '$value'
            }
          }

        }];

        var dataStore = new DataStore(STORE_NAME, schemas);
        var aggregation = dataStore.aggregate(
            schemas.TestSchema.collectionName, steps);

        return Promise.all([
          expect(aggregation).to.eventually.be.instanceof(Array),
          expect(aggregation).to.eventually.have.length(1),
          expect(aggregation.then(function (results) {
            return results[0].avgValue;
          })).to.eventually.equal(50.5)
        ]);
      });
    });
  });
});
