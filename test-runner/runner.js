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
var fs = require('fs');

if (typeof argv.trace !== 'string') {
  console.error('Trace file output location needs to be passed.');
  process.exit(1);
}

path = argv.trace;

// Check if the file exists.
try {
  fileStats = fs.statSync(path);

  if (fileStats)
    console.warn('Warning: Trace file already exists.');

} catch (e) {
  // No worries here... If the file doesn't exist we can
  // ignore the warning and go.
}

var URL = 'http://example.com';
var SELECTOR_FOR_LOADED = 'a';

var fs = require('fs');
var scrollTest = require('./tests/scroll');
var driver = require('./driver');
var browser = driver.start();
var webdriver = driver.webdriver;

var steps = [

  function start () {
    browser.get(URL);
  },

  function waitForPageLoad () {
    browser.wait(function() {
      return browser.isElementPresent(webdriver.By.css(SELECTOR_FOR_LOADED));
    }, 10000);
  },

  function runTest () {
    scrollTest.run(browser);
  }
];

driver.flow(steps);
driver.getTrace(browser).then(function(traceData) {
  fs.writeFile(path, traceData, 'utf8');
  browser.quit();
});
