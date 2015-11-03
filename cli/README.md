# Big Rig CLI

Big Rig's CLI performs the same kinds of analysis as the web app, just on the CLI. This makes it a good fit for use in a CI environment.

![Big Rig CLI](https://cloud.githubusercontent.com/assets/617438/10911511/123156f6-823d-11e5-86a5-ae30dab6122e.png)

## Installation

There are some dependencies that will need to be installed before you are
able to use the CLI:

1. `cd cli`
1. `npm install`
1. `chmod +x ./bigrig.js`

## Usage

```
./bigrig.js --trace=/path/to/trace.json
```

You should see a pretty printed output of the time breakdown for the trace.

## License

See /LICENSE

## Thanks

The tracing code is a manipulated version of [Chrome's Trace Viewer](https://github.com/catapult-project/catapult/tree/master/tracing). A huge thanks to the Chromium engineers for making it possible to analyze traces.

Please note: this is not an official Google product.
