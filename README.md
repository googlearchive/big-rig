# Big Rig

Big Rig is an experimental, proof-of-concept system for generating and parsing Chrome's trace files. It has a web app dashboard that will allow you to track performance statistics over time, as well as a CLI version for integrating with other parts of your build system.

Both the web app and CLI ingest trace files that can come from:

* [WebPagetest](http://webpagetest.org)
* [Chrome DevTools’ Timeline](https://developers.google.com/web/tools/chrome-devtools/profile/evaluate-performance/timeline-tool)
* [ChromeDriver](https://sites.google.com/a/chromium.org/chromedriver/)
* [Telemetry](https://www.chromium.org/developers/telemetry)

In this project there are three sub-items:

1. [A dashboard web app](app/).
1. [A CLI processor](cli/).
1. [An automated Chrome test runnner](test-runner/).

## Issues

There are many missing features, and tests and such that need adding to Big Rig. However, in the interests of launch early and iterate often (a grand tradition), the repo is here for all to see!

Do feel free to file issues against Big Rig, though.

## Owner

Paul Lewis - [@aerotwist](https://twitter.com/aerotwist).

## License

Please see /LICENSE for more info.

Please note: this is not an official Google product.
