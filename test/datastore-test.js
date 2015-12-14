'use strict';

/* global describe, it */

var chai = require('chai');
var expect = chai.expect;
var chaiAsPromised = require('chai-as-promised');
var dataStore = require('../src/models/datastore');
var models = require('./data/models/Models');
var STORE_NAME = 'test';

chai.use(chaiAsPromised);

describe('models.DataStore', function () {
  // Basic setup.
  describe('DataStore.configure', function () {
    it ('throws if no config is given', function () {
      return expect(dataStore.configure).to.throw(
        Error, 'DataStore configuration not provided.'
      );
    });
  });

  // Put.
  describe('DataStore.put', function () {
    // Set up the data store before each run.
    beforeEach (function () {
      dataStore.configure({
        store: STORE_NAME,
        models: models
      });
    });

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
      var put = dataStore.put(undefined, {});

      return expect(put).to.eventually.be.rejectedWith(
        Error, 'Model type not provided.'
      );
    });

    it ('rejects if no data is given', function () {
      var put = dataStore.put('test');

      return expect(put).to.eventually.be.rejectedWith(
        Error, 'put() requires an object.'
      );
    });

    it ('rejects if data is not an object (requires)', function () {
      var put = dataStore.put('testnorequire', 1);

      return expect(put).to.eventually.be.rejectedWith(
        Error, 'put() requires an object.'
      );
    });

    it ('rejects if data is an array with no objects', function () {
      var put = dataStore.put('testnorequire', [1, {
        name: 'testObject'
      }]);

      return expect(put).to.eventually.be.rejectedWith(
        Error, 'put() given array of entries which are not all objects.'
      );
    });

    it ('rejects if data contains an empty property', function () {
      var testObject = {
        name: 'testObject'
      };

      // This attempts to write to the root object, causing MongoDB issues.
      testObject[''] = '';

      var put = dataStore.put('testnorequire', testObject);

      return expect(put).to.eventually.be.rejectedWith(
        'Cannot call setValue on the root object'
      );
    });

    it ('rejects if given an existing model', function () {
      var testObject = {
        name: 'testName'
      };

      return new Promise(function (resolve, reject) {
        var mongoose = require('mongoose');
        mongoose.connect('mongodb://localhost/' + STORE_NAME, function () {
          var connection = mongoose.connection;
          var ConnectedModel = models.test.factory(connection);

          var instance = new ConnectedModel(testObject);
          instance.save(function (err, result) {
            if (err) {
              throw err;
            }

            mongoose.disconnect();
            resolve(result);
          });
        });
      }).then(function (newInstance) {
        newInstance.name = 'testNameUpdated';
        return expect(dataStore.put('test', newInstance)).to.be.rejectedWith(
          Error, 'put() cannot take an existing model'
        );
      });
    });

    it ('creates a new document', function () {
      var testObject = {
        name: 'testName'
      };

      return dataStore.put('test', testObject)
        .then(function () {
          return new Promise(function (resolve, reject) {
            var mongoose = require('mongoose');
            mongoose.connect('mongodb://localhost/' + STORE_NAME, function () {
              var connection = mongoose.connection;
              var connectedModel = models.test.factory(connection);

              connectedModel.find(testObject, function (err, result) {
                if (err) {
                  throw err;
                }

                mongoose.disconnect();
                resolve(result[0]);
              });
            });
          });
        }).then(function (retrievedInstance) {
          return expect(retrievedInstance.name).to.equal(testObject.name);
        });
    });

    it ('updates an existing document\'s simple property', function () {
      var testObject = {
        name: 'testName'
      };
      var originalInstance;

      return new Promise(function (resolve, reject) {
        var mongoose = require('mongoose');
        mongoose.connect('mongodb://localhost/' + STORE_NAME, function () {
          var connection = mongoose.connection;
          var ConnectedModel = models.test.factory(connection);

          var instance = new ConnectedModel(testObject);
          instance.save(function (err, result) {
            if (err) {
              throw err;
            }

            mongoose.disconnect();
            resolve(result);
          });
        });
      }).then(function (newInstance) {
        originalInstance = newInstance;

        return dataStore.put('test', {
          name: 'testNameUpdated'
        }, newInstance._id);
      }).then(function () {
        return new Promise(function (resolve, reject) {
          var mongoose = require('mongoose');
          mongoose.connect('mongodb://localhost/' + STORE_NAME, function () {
            var connection = mongoose.connection;
            var connectedModel = models.test.factory(connection);

            connectedModel.find({
              name: 'testNameUpdated'
            }, function (err, result) {
              if (err) {
                throw err;
              }

              mongoose.disconnect();
              resolve(result[0]);
            });
          });
        });
      }).then(function (updatedInstance) {
        // Check this is still the same object.
        var updatedInstanceID = updatedInstance._id.toString();
        var originalInstanceID = originalInstance._id.toString();

        expect(updatedInstanceID).to.equal(originalInstanceID);

        // But that it has a new name.
        return expect(updatedInstance.name).to.equal('testNameUpdated');
      });
    });

    it ('updates an existing document\'s populated property', function () {
      var testObject = {
        name: 'test'
      };
      var altTestObject = {
        name: 'altTest'
      };
      var testReferrerObject = {
        name: 'test referrer'
      };

      var insertedInstances;

      return new Promise(function (resolve, reject) {
        var mongoose = require('mongoose');
        mongoose.connect('mongodb://localhost/' + STORE_NAME, function () {
          var connection = mongoose.connection;
          var connectedModel = models.test.factory(connection);

          // Store the test and alt objects.
          connectedModel.create([testObject, altTestObject],
            function (err, result) {
              if (err) {
                throw err;
              }

              mongoose.disconnect();
              resolve(result);
            });
        });
      }).then(function (newInstances) {
        insertedInstances = newInstances;

        return new Promise(function (resolve, reject) {
          var mongoose = require('mongoose');
          mongoose.connect('mongodb://localhost/' + STORE_NAME, function () {
            var connection = mongoose.connection;
            var ConnectedModel = models.testreferrer.factory(connection);

            // Set the test to point to the new instance.
            testReferrerObject._test = insertedInstances[0]._id;

            var instance = new ConnectedModel(testReferrerObject);
            instance.save(function (err, result) {
              if (err) {
                throw err;
              }

              mongoose.disconnect();
              resolve(result);
            });
          });
        });
      }).then(function (testRefObject) {
        // Update the referring test to point to the altTestObject.
        return dataStore.put('testreferrer', {
          _test: insertedInstances[1]._id
        }, testRefObject._id);
      }).then(function () {
        // Now check in to see if the populated version is correct.
        return new Promise(function (resolve, reject) {
          var mongoose = require('mongoose');
          mongoose.connect('mongodb://localhost/' + STORE_NAME, function () {
            var connection = mongoose.connection;
            var connectedModel = models.testreferrer.factory(connection);

            connectedModel
              .find()
              .populate('_test')
              .exec(function (err, result) {
                if (err) {
                  throw err;
                }

                mongoose.disconnect();
                resolve(result[0]);
              });
          });
        });
      }).then(function (record) {
        return expect(record._test.name).to.equal(altTestObject.name);
      });
    });

    it ('can bulk insert multiple records', function () {
      var testObjects = [
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

      return dataStore.put('test', testObjects)
        .then(function () {
          return new Promise(function (resolve, reject) {
            var mongoose = require('mongoose');
            mongoose.connect('mongodb://localhost/' + STORE_NAME, function () {
              var connection = mongoose.connection;
              var connectedModel = models.test.factory(connection);

              connectedModel.find(function (err, results) {
                if (err) {
                  throw err;
                }

                mongoose.disconnect();
                resolve(results);
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
    // Set up the data store before each run.
    beforeEach (function () {
      dataStore.configure({
        store: STORE_NAME,
        models: models
      });
    });

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
      return expect(dataStore.get()).to.eventually.be.rejectedWith(
        Error, 'Model type not provided.'
      );
    });

    it ('returns an empty array when there are no records', function () {
      var getAll = dataStore.get('test');

      return Promise.all([
        expect(getAll).to.eventually.be.instanceof(Array),
        expect(getAll).to.eventually.have.length(0)
      ]);
    });

    it ('rejects when given a garbage query', function () {
      var getAll = dataStore.get('wobblejobble');

      return expect(getAll).to.eventually.be.rejectedWith(
        Error, 'Unknown model type provided: wobblejobble'
      );
    });

    it ('returns an array of records', function () {
      var testObject = {
        name: 'testName'
      };

      return new Promise(function (resolve, reject) {
        var mongoose = require('mongoose');
        mongoose.connect('mongodb://localhost/' + STORE_NAME, function () {
          var connection = mongoose.connection;
          var ConnectedModel = models.test.factory(connection);

          var instance = new ConnectedModel(testObject);
          instance.save(function (err, result) {
            if (err) {
              throw err;
            }

            mongoose.disconnect();
            resolve(result);
          });
        });
      }).then(function (newInstance) {
        var getAll = dataStore.get('test');

        return Promise.all([
          expect(getAll).to.eventually.be.instanceof(Array),
          expect(getAll).to.eventually.have.length(1),
          expect(getAll.then(function (results) {
            return results[0].name;
          })).to.eventually.equal(testObject.name)
        ]);
      });
    });

    it ('sorts ascending', function () {
      var testObjects = [
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

      return new Promise(function (resolve, reject) {
        var mongoose = require('mongoose');
        mongoose.connect('mongodb://localhost/' + STORE_NAME,
          function () {
            var connection = mongoose.connection;
            var connectedModel = models.test.factory(connection);

            connectedModel.create(testObjects, (function (err, result) {
              if (err) {
                throw err;
              }

              mongoose.disconnect();
              resolve(result);
            }));
          }
        );
      })
      .then(function () {
        var getAll = dataStore.get('test', {
          sort: {
            createdAt: 1
          }
        });

        return Promise.all([
          expect(getAll).to.eventually.be.instanceof(Array),
          expect(getAll).to.eventually.have.length(3),
          expect(getAll.then(function (results) {
            return results[0].name;
          })).to.eventually.equal(testObjects[0].name)
        ]);
      });
    });

    it ('sorts descending', function () {
      var testObjects = [
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

      return new Promise(function (resolve, reject) {
        var mongoose = require('mongoose');
        mongoose.connect('mongodb://localhost/' + STORE_NAME,
          function () {
            var connection = mongoose.connection;
            var connectedModel = models.test.factory(connection);

            connectedModel.create(testObjects, (function (err, result) {
              if (err) {
                throw err;
              }

              mongoose.disconnect();
              resolve(result);
            }));
          }
        );
      })
      .then(function () {
        var getAll = dataStore.get('test', {
          sort: {
            createdAt: -1
          }
        });

        return Promise.all([
          expect(getAll).to.eventually.be.instanceof(Array),
          expect(getAll).to.eventually.have.length(3),
          expect(getAll.then(function (results) {
            return results[0].name;
          })).to.eventually.equal(testObjects[2].name)
        ]);
      });
    });

    it ('offsets and limits the records if needed', function () {
      var testObjects = [
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

      return new Promise(function (resolve, reject) {
        var mongoose = require('mongoose');
        mongoose.connect('mongodb://localhost/' + STORE_NAME,
          function () {
            var connection = mongoose.connection;
            var connectedModel = models.test.factory(connection);

            connectedModel.create(testObjects, (function (err, result) {
              if (err) {
                throw err;
              }

              mongoose.disconnect();
              resolve(result);
            }));
          }
        );
      })
      .then(function () {
        var getAll = dataStore.get('test', {
          limit: 1, offset: 1, sort: {
            createdAt: 1
          }
        });

        return Promise.all([
          expect(getAll).to.eventually.be.instanceof(Array),
          expect(getAll).to.eventually.have.length(1),
          expect(getAll.then(function (results) {
            return results[0].name;
          })).to.eventually.equal(testObjects[1].name)
        ]);
      });
    });

    it ('gets by ID (array)', function () {
      var testObject = {
        name: 'testName'
      };

      return new Promise(function (resolve, reject) {
        var mongoose = require('mongoose');
        mongoose.connect('mongodb://localhost/' + STORE_NAME, function () {
          var connection = mongoose.connection;
          var ConnectedModel = models.test.factory(connection);

          var instance = new ConnectedModel(testObject);
          instance.save(function (err, result) {
            if (err) {
              throw err;
            }

            mongoose.disconnect();
            resolve(result);
          });
        });
      }).then(function (newInstance) {
        var get = dataStore.get('test', {
          criteria: {
            _id: newInstance._id
          }
        });

        return Promise.all([
          expect(get).to.eventually.be.instanceof(Array),
          expect(get).to.eventually.have.length(1),
          expect(get.then(function (results) {
            return results[0].name;
          })).to.eventually.equal(testObject.name)
        ]);
      });
    });

    it ('gets by ID (convenience method, single object)', function () {
      var testObject = {
        name: 'testName'
      };

      return new Promise(function (resolve, reject) {
        var mongoose = require('mongoose');
        mongoose.connect('mongodb://localhost/' + STORE_NAME, function () {
          var connection = mongoose.connection;
          var ConnectedModel = models.test.factory(connection);

          var instance = new ConnectedModel(testObject);
          instance.save(function (err, result) {
            if (err) {
              throw err;
            }

            mongoose.disconnect();
            resolve(result);
          });
        });
      }).then(function (newInstance) {
        var getById = dataStore.getById('test', newInstance._id)
          .then(function (result) {
            return result.name;
          });

        return expect(getById).to.eventually.equal(testObject.name);
      });
    });

    it ('populates a record', function () {
      var testObject = {
        name: 'test'
      };

      var testReferrerObject = {
        name: 'test referrer'
      };

      return new Promise(function (resolve, reject) {
        var mongoose = require('mongoose');
        mongoose.connect('mongodb://localhost/' + STORE_NAME, function () {
          var connection = mongoose.connection;
          var ConnectedModel = models.test.factory(connection);

          var instance = new ConnectedModel(testObject);
          instance.save(function (err, result) {
            if (err) {
              throw err;
            }

            mongoose.disconnect();
            resolve(result);
          });
        });
      }).then(function (newInstance) {
        return new Promise(function (resolve, reject) {
          var mongoose = require('mongoose');
          mongoose.connect('mongodb://localhost/' + STORE_NAME, function () {
            var connection = mongoose.connection;
            var ConnectedModel = models.testreferrer.factory(connection);

            // Set the test to point to the new instance.
            testReferrerObject._test = newInstance._id;

            var instance = new ConnectedModel(testReferrerObject);
            instance.save(function (err, result) {
              if (err) {
                throw err;
              }

              mongoose.disconnect();
              resolve(result);
            });
          });
        });
      }).then(function () {
        var get = dataStore.get('testreferrer', {
          populate: '_test'
        });

        return Promise.all([
          expect(get).to.eventually.be.instanceof(Array),
          expect(get).to.eventually.have.length(1),
          expect(get.then(function (results) {
            return results[0]._test.name;
          })).to.eventually.equal(testObject.name)
        ]);
      });
    });
  });

  // Delete.
  describe('DataStore.delete', function () {
    // Set up the data store before each run.
    beforeEach (function () {
      dataStore.configure({
        store: STORE_NAME,
        models: models
      });
    });

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
      var testObject = {
        name: 'testName'
      };

      return new Promise(function (resolve, reject) {
        var mongoose = require('mongoose');
        mongoose.connect('mongodb://localhost/' + STORE_NAME, function () {
          var connection = mongoose.connection;
          var ConnectedModel = models.test.factory(connection);

          var instance = new ConnectedModel(testObject);
          instance.save(function (err, result) {
            if (err) {
              throw err;
            }

            mongoose.disconnect();
            resolve(result);
          });
        });
      }).then(function (newInstance) {
        var ID = '56695059b5333b7d7573ffbf';
        return expect(dataStore.delete('test', ID)).to.eventually.rejectedWith(
          Error, 'Unable to find object with ID: ' + ID
        );
      });
    });

    it ('deletes an object', function () {
      var testObject = {
        name: 'testName'
      };

      return new Promise(function (resolve, reject) {
        var mongoose = require('mongoose');
        mongoose.connect('mongodb://localhost/' + STORE_NAME, function () {
          var connection = mongoose.connection;
          var ConnectedModel = models.test.factory(connection);

          var instance = new ConnectedModel(testObject);
          instance.save(function (err, result) {
            if (err) {
              throw err;
            }

            mongoose.disconnect();
            resolve(result);
          });
        });
      }).then(function (newInstance) {
        var deleteAndGet =
          dataStore
            .delete('test', newInstance._id)
            .then(function () {
              return dataStore.get('test');
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
    // Set up the data store before each run.
    beforeEach (function () {
      dataStore.configure({
        store: STORE_NAME,
        models: models
      });
    });

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
      var testObjects = [];
      var size = 100;

      for (var i = 0; i < size; i++) {
        testObjects.push({
          name: ('record' + i),
          createdAt: new Date(2015, (i % 12), 1),
          value: (i + 1)
        });
      }

      return new Promise(function (resolve, reject) {
        var mongoose = require('mongoose');
        mongoose.connect('mongodb://localhost/' + STORE_NAME,
          function () {
            var connection = mongoose.connection;
            var connectedModel = models.test.factory(connection);

            connectedModel.create(testObjects, (function (err, result) {
              if (err) {
                throw err;
              }

              mongoose.disconnect();
              resolve(result);
            }));
          }
        );
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

        var aggregate = dataStore.aggregate('test', steps);

        return Promise.all([
          expect(aggregate).to.eventually.be.instanceof(Array),
          expect(aggregate).to.eventually.have.length(1),
          expect(aggregate.then(function (results) {
            return results[0].avgValue;
          })).to.eventually.equal(50.5)
        ]);
      });
    });
  });
});
