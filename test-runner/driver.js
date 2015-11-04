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

/*
 * This approach is very much based on Sam Saccone's excellent memory leak
 * detector: Drool.
 * @see https://github.com/samccone/drool
 */
var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var controlFlow = webdriver.promise.controlFlow();

function start (opts) {
  opts = opts || {};

  var options = new chrome.Options();
  var traceCategories = [
    'blink.console',
    'devtools.timeline',
    'toplevel',
    'disabled-by-default-devtools.timeline',
    'disabled-by-default-devtools.timeline.frame'
  ];

  if (typeof opts.test.categories !== 'undefined') {
    opts.test.categories.forEach(function(category) {
      traceCategories.push(category);
    });
  }

  if (opts.android)
    options = options.androidChrome();

  // Add on GPU benchmarking.
  options.addArguments('enable-gpu-benchmarking');

  // Run without a sandbox.
  options.addArguments('no-sandbox');

  if (typeof opts.test.flags !== 'undefined') {
    opts.test.flags.forEach(function(flag) {
      options.addArguments(flag);
    });
  }

  // Set up that we want to get trace data.
  options.setLoggingPrefs({ performance: 'ALL' });
  options.setPerfLoggingPrefs({
    'traceCategories': traceCategories.join(',')
  })

  return new webdriver.Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
}

function flow (steps) {
  steps.forEach(function(step) {
    controlFlow.execute(step);
  });
}

function getTrace(browser) {
  return (new webdriver.WebDriver.Logs(browser))
    .get('performance')
    .then(function(logs) {
      var trace = '';
      var processedLog;
      logs.forEach(function(log, index, arr) {

        // Parse the message.
        processedLog = JSON.parse(log.message);

        // Skip any records that aren't categorized.
        if (!processedLog.message.params.cat)
          return;

        // Now append it for the trace file.
        trace += JSON.stringify(processedLog.message.params) +
            ((index < arr.length - 1) ? ',' : '') + '\n';
      });

      return '[' + trace + ']';
    })
}

module.exports = {
  start: start,
  flow: flow,
  webdriver: webdriver,
  getTrace: getTrace
};
