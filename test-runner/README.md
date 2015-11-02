## Big Rig Test Runner

This is a test runner built on top of [ChromeDriver](https://sites.google.com/a/chromium.org/chromedriver/).

The current runner does a scroll test on desktop Chrome Stable, however it can be easily modified and extended to perform other tests.

## Installation

There are some dependencies that will need to be installed before you are
able to use the test runner:

1. `cd test-runner`
1. `npm install`

## Usage

To run the test run node against `index.js` and provide an output path. **You will need to modify the URL (and the CSS selector used to determine that the page has loaded) before running the test.**

```
node index.js ~/Desktop/trace.json
```

On run you should see Chrome start, the test run, and, finally, the page close. There should be a trace file written that you can import into the Big Rig web app, or provide to the CLI.

## Thanks

Thanks to [Sam Saccone](https://twitter.com/samccone), whose brilliant work on [Drool](https://github.com/samccone/drool) acted as a model for utilizing ChromeDriver.
