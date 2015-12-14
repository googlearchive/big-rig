'use strict';

let file = require('file');
let models = {};

file.walkSync('./test/models', (start, dirs, files) => {
  files.forEach(modelFile => {
    if (modelFile === 'models.js' || !(/.js$/.test(modelFile))) {
      return;
    }

    let model = require('./' + modelFile.replace(/.js$/, ''));

    models[model.name] = {
      factory: model.factory,
      instance: null
    };
  });
});

module.exports = models;
