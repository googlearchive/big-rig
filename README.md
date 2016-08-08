# So very cool Big Rig

So very cool Big Rig is an **experimental**, **proof-of-concept** system for generating and parsing Chrome's trace files. It has a web app dashboard that will allow you to track performance statistics over time, as well as a CLI version for integrating with other parts of your build system.

![Big Rig web app](https://cloud.githubusercontent.com/assets/617438/10881331/b83e9868-8159-11e5-9f0e-285549e89c76.png)

Both the web app and CLI ingest trace files that can come from:

* [WebPagetest](http://webpagetest.org)
* [Chrome DevTools’ Timeline](https://developers.google.com/web/tools/chrome-devtools/profile/evaluate-performance/timeline-tool)
* [ChromeDriver](https://sites.google.com/a/chromium.org/chromedriver/)
* [Telemetry](https://www.chromium.org/developers/telemetry)

In this project there are two sub-items:

1. [A dashboard web app](app/).
1. [An automated Chrome test runnner](test-runner/).

There is also a CLI / node module for Big Rig, which [you can find in its own repo](https://github.com/GoogleChrome/node-big-rig).

## Issues

There are many missing features, tests, and options that need adding to Big Rig. However, in the interests of launch early and iterate often (a grand tradition), the repo is here for all to see! Do feel free to file issues against it, though.

## Roadmap

Mainly at this point it's to deprecate the python-based backend for the web app and replace it with the JS- /NodeJS-based one. This will provide some additional options on processing traces for one, and should allow for a more of a plugin-based solution.

## Owner

Paul Lewis - [@aerotwist](https://twitter.com/aerotwist).

## License

Please see /LICENSE for more info.

Please note: this is not an official Google product.
