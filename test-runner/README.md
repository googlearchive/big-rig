## Big Rig Test Runner

This is a test runner built on top of [ChromeDriver](https://sites.google.com/a/chromium.org/chromedriver/).

The current runner does a scroll test on desktop Chrome Stable, however it can be easily modified and extended to perform other tests.

## Installation

There are some dependencies that will need to be installed before you are
able to use the test runner:

1. `cd test-runner`
1. `npm install`
1. `chmod +x ./runner.js`

## Usage

To run the test run node against `runner.js` and provide an output path. **You will need to modify the URL (and the CSS selector used to determine that the page has loaded) before running the test.**

```
./runner.js --trace=/path/to/trace.json
```

On run you should see Chrome start, the test run, and, finally, the page close. There should be a trace file written that you can import into the Big Rig web app, or provide to the CLI.

### Running on an Android device

Firstly, ensure you have Chrome on the device and have [enabled USB Debugging](https://developers.google.com/web/tools/chrome-devtools/debug/remote-debugging/remote-debugging).

In `runner.js`, update the call to the driver to include the `android` option:

```javascript
var browser = driver.start({ android: true });
```

## Thanks

Thanks to [Sam Saccone](https://twitter.com/samccone), whose brilliant work on [Drool](https://github.com/samccone/drool) acted as a model for utilizing ChromeDriver.
