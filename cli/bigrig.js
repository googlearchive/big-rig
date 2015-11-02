#!/usr/bin/env node

/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var argv = require('yargs').argv;
var clc = require('cli-color');
var fs = require('fs');
var processor = require('./processor');
var path = '';

// Does a bunch on the global object, because the code for trace viewer
// currently operates on `window`, and the conversion doesn't account for
// requires and modules.
require('./global-config.js');
require('./third_party/tracing/importer/import.js');
require('./third_party/tracing/extras/importer/trace_event_importer.js');
require('./third_party/tracing/extras/rail/rail_score.js');
require('./third_party/tracing/extras/rail/rail_ir_finder.js');
require('./tracing-config.js');

// Find which file needs parsing.
if (typeof argv.trace !== 'string') {
  console.error('Trace file needs to be passed.');
  process.exit(1);
}

path = argv.trace;

// Check the file exists.
try {
  fs.statSync(path);
} catch (e) {
  console.error('Trace file could not be found.');
  process.exit(1);
}

function prettyPrint (result, indent) {

  indent = indent || 0;

  var paddingDistance = 40;
  var labelPadding = padOut('', indent);
  var keys = Object.keys(result);
  var key;
  var colorFn = clc.cyan;
  var label;
  var value;

  function padOut(str, len) {

    while(str.length < len)
      str += ' ';

    return str;
  }

  for (var k = 0; k < keys.length; k++) {

    key = keys[k];
    if (key === 'RAIL Score') {
      colorFn = clc.magentaBright;
    }

    label = colorFn(padOut(key + ':', paddingDistance - indent));
    value = result[keys[k]];

    if (typeof value === 'number')
      value = value.toFixed(2) + 'ms';

    if (typeof value === 'object') {
      console.log(labelPadding + label);
      prettyPrint(value, indent + 2);
    }
    else {
      var msg = labelPadding + label + value;
      console.log(msg);
    }
  }
}

// Read the file, analyze, and print.
var contents = fs.readFileSync(path, 'utf8');
var results = processor.analyzeTrace(contents);
prettyPrint(results);
