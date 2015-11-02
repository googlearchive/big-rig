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

module.exports = {

  run: function (browser) {
    // Allow the browser to wait some time before failing the scroll.
    browser.manage().timeouts().setScriptTimeout(60000);

    // Now scroll.
    var done = browser.executeAsyncScript(
      [
        'console.time("smooth-scroll");',
        'var driverCallback = arguments[arguments.length - 1];',
        'var callback = function () {',
          'console.timeEnd("smooth-scroll");',
          'setTimeout(driverCallback, 200);',
        '};',
        'chrome.gpuBenchmarking.smoothScrollBy(',
          'document.body.offsetHeight - window.innerHeight, callback);',
      ].join('')
    );
  }

};
