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
var processor = require('./lib/processor');
var path = '';

// Find which file needs parsing.
if (typeof argv.trace !== 'string') {
  console.error(
      'Trace file path needs to be passed, --trace=/path/to/trace.json');
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
  var suffix;

  function padOut(str, len) {

    while(str.length < len)
      str += ' ';

    return str;
  }

  if (keys.length === 0)
    console.log(labelPadding + '{}');

  for (var k = 0; k < keys.length; k++) {

    suffix = '';
    key = keys[k];
    value = result[keys[k]];

    if (key === 'title' || key === 'type')
      continue;

    if (!isNaN(parseInt(key))) {
      colorFn = clc.magentaBright;
      key = value.title + ' [' + value.type + ']';
    }

    label = colorFn(padOut(key + ':', paddingDistance - indent));

    if (typeof value === 'number') {

      if (key !== 'fps') {
        value = value.toFixed(2);
        suffix = 'ms';
      }

      value = value + suffix;
    }

    if (typeof value === 'object') {
      console.log(labelPadding + label);
      prettyPrint(value, indent + 2);
    } else {
      var msg = labelPadding + label + value;
      console.log(msg);
    }
  }
}

// Read the file, analyze, and print.
var contents = fs.readFileSync(path, 'utf8');
var results = processor.analyzeTrace(contents);

if (typeof argv['pretty-print'] !== 'undefined')
  prettyPrint(results);
else
  console.log(JSON.stringify(results));
