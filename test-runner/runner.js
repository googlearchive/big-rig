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

var argv = require('yargs')
    .usage('Usage: bigrigrunner -url <url> -selector <selector> -output <file>')
    .option('url', {
      alias: 'u',
      demand: true,
      describe: 'The URL to run against'
    })
    .option('selector', {
      alias: 's',
      demand: true,
      describe: 'The selector indicating that load has completed'
    })
    .option('output', {
      alias: 'o',
      demand: false,
      default: '',
      describe: 'The location of the trace file'
    })
    .option('test', {
      alias: 't',
      demand: false,
      default: 'scroll',
      describe: 'The test to run'
    })
    .option('android', {
      alias: 'a',
      demand: false,
      default: false,
      describe: 'Whether to run over adb'
    })
    .argv;


var fs = require('fs');
var path = argv.output;

if (typeof argv.url !== 'string') {
  console.error('Error: URL must be a string');
  process.exit(1);
}

if (typeof argv.output !== 'string') {
  console.error('Error: Output location must be a string');
  process.exit(1);
}

if (typeof argv.selector !== 'string') {
  console.log(argv.selector, typeof argv.selector);
  console.error('Error: Selector must be a string');
  process.exit(1);
}

var testPath = '';

switch (argv.test) {

  case 'load':
    testPath = './tests/load';
    break;

  case 'scroll':
    testPath = './tests/scroll';
    break;

  default:
    console.warn('Unknown test type (' + argv.test + '), using load');
    testPath = './tests/load';
    break;
}

var test = require(testPath);
var driver = require('./driver');
var browser = driver.start({
  test: test.options,
  android: argv.android
});
var webdriver = driver.webdriver;

var steps = [

  function start () {
    browser.get(argv.url);
  },

  function waitForPageLoad () {
    browser.wait(function() {
      return browser.isElementPresent(webdriver.By.css(argv.selector));
    }, 10000);
  },

  function runTest () {
    test.run(browser);
  }
];

driver.flow(steps);
driver.getTrace(browser).then(function(traceData) {

  // If the user specifies an output location, use it.
  // Otherwise log it out.
  if (argv.output !== '') {

    // Check if the file exists.
    try {
      fileStats = fs.statSync(path);

      if (fileStats)
        console.warn('Warning: Trace file already exists.');

    } catch (e) {
      // No worries here... If the file doesn't exist we can
      // ignore the warning and go.
    }

    fs.writeFile(path, traceData, 'utf8');
  } else {
    console.log(traceData);
  }

  browser.quit();
});
