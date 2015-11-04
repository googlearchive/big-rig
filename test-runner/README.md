## Big Rig Test Runner

This is a test runner built on top of [ChromeDriver](https://sites.google.com/a/chromium.org/chromedriver/).

The current runner does a scroll test on desktop Chrome Stable, however it can be easily modified and extended to perform other tests.

This is in an early phase, and will ultimately become its own npm module at some point. You will need to manually link it if you wish to use it globally after cloning

## Installation

If you wish to use the bigrigrunner command globally, you will need to link it:

1. `cd test-runner`
1. `npm link`

If you wish to just run it from the folder:

1. `cd test-runner`
1. `npm install`
1. `chmod +x ./runner.js`

## Usage

To run the test run node against `runner.js` and provide an output path. **You will need also to pass the URL (and the CSS selector used to determine that the page has loaded) before running the test.**

```bash
./runner.js --url http://example.com --selector a --output ~/Desktop/scroll.json
```

Alternatively, if you have linked the runner you can call `bigrigrunner`. You can also use shorthand syntax for the arguments if you prefer.

```bash
bigrigrunner -u https://aerotwist.com -s div.subscribe -o ~/Desktop/aerotwist.scroll.json
```

On run you should see Chrome start, the test run, and, finally, the page close. There should be a trace file written that you can import into the Big Rig web app, or provide to [the CLI](https://github.com/GoogleChrome/node-big-rig).

You can also run the Big Rig runner and pipe its output straight into [Big Rig's CLI](https://github.com/GoogleChrome/node-big-rig):

```bash
bigrigrunner -u https://aerotwist.com -s div.subscribe | bigrig --pretty-print
```

### Running on an Android device

Firstly, ensure you have Chrome on the device and have [enabled USB Debugging](https://developers.google.com/web/tools/chrome-devtools/debug/remote-debugging/remote-debugging). Then use the '-a' flag.

```bash
bigrigrunner -u https://aerotwist.com -s div.subscribe -o ~/Desktop/trace.json -a
```

## Thanks

Thanks to [Sam Saccone](https://twitter.com/samccone), whose brilliant work on [Drool](https://github.com/samccone/drool) acted as a model for utilizing ChromeDriver.
