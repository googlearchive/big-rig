# Big Rig Web App

The Big Rig Web App is a dashboard that lets you track your performance over time.

The trace files can be uploaded manually, or via a GitHub Webhook. The results are presented in a dashboard and use [RAIL](http://www.smashingmagazine.com/2015/10/rail-user-centric-model-performance/)-centric thresholds.

## Installation

### Prerequisites

The backend uses Python and Google App Engine (a node version is in the works).

1. Install the [Google Cloud SDK](https://cloud.google.com/sdk/).
2. Install the [Google App Engine for Python](https://cloud.google.com/appengine/downloads)
3. Install Gulp `npm install --global gulp`

### Running Big Rig

1. Clone the [Big Rig repo](https://github.com/GoogleChrome/big-rig) `git clone https://github.com/GoogleChrome/big-rig.git`.
2. Change directory to the app directory within your Big Rig clone `cd big-rig/app`
3. Install the Nodejs dependencies `npm install`
4. Run `gulp` (or `gulp dev` if you plan to change code) in order to build Big Rig.
5. Open the Google App Engine Launcher application
6. Within Google App Engine Launcher add the `big-rig/app/dist/` directory as an existing project
7. Click Run within Google App Engine Launcher
8. Visit `http://localhost` with the port number Google App Engine Launcher gave you, e.g. `http://localhost:8080`.
9. Check the "Sign in as Administrator" checkbox and click login
10. Big Rig is now running, to set up a project follow the "Getting Started" guide from within the Big Rig help page. e.g. `http://localhost:8080/help/getting-started/`


## Current state

This project is an experiment / proof-of-concept, and patches, ideas, and thoughts are all very welcome. Do feel free to contribute, but because it's under active development **please [read the contributing guide](CONTRIBUTING.md) first**. In particular, please file an issue before writing any code so we can discuss whether the change is appropriate. (I don't want you to waste time on a patch for something that's being refactored anyway!)

## Projects and Actions
In the web app,a  user creates a **Project**, which is a logical grouping of **Action**s (things on which they wish to track performance details).

An Action is categorized one of three ways:

* Response
* Animation
* Load

You can change an **Actio**n's type at any time. The **Action** type is used to determine how to present the data.

When a trace is ingested it must be matched to an **Actio**n, or one must be created. If the developer has used `console.time('MenuSlideOut')` and `console.timeEnd('MenuSlideOut')` to mark a range in the trace (in this case called 'MenuSlideOut', which we may regard as a Response, and something to be completed in less than 100ms) this will be used to match to an existing **Action**, and in this way successive traces with 'MenuSlideOut' will be grouped together and tracked over time. (There could be a second **Action** for the animation itself, which one would want to have run at 60fps.)

If none can be found, a new **Action** will be created, if possible, and the data will be appended. It is possible for a developer to include several imports for the same **Action** within a single trace through use of multiple calls to console.time*(label).

For processing, the following trace categories are assumed:

* blink.console
* devtools.timeline
* toplevel
* disabled-by-default-devtools.timeline
* disabled-by-default-devtools.timeline.frame

These categories are the default for Chrome DevTools, WebPagetest, and are configurable for Telemetry (or any other automated trace suite), like ChromeDriver.

## Technologies

### Backend

* Python (uses Telemetry cloned from Chrome source) and GAE - Status: In progress
* JavaScript (uses Trace Viewer) - Status: Pending

### Frontend

* [Material Design Lite](http://getmdl.io)

## Trace Processing

As much data as possible is captured from the trace and stored, and the trace file itself is purged by default (though the user may keep the blobs if desired).

The general processing model is:

* For the trace, filter down to a single (non-Chrome Tracing) named process.
* For the process, locate the following threads:
    * Compositor
    * CrRendererMain
    * CompositorTileWorker*
* For the process, locate the “windows of interest”, based on `console.time*()`
    * If none is found, assume the entire range is of interest.
    * For each thread, locate slices within each “window of interest” that match the following:
      * **Parse HTML**
          * `ParseHTML`
      * **JavaScript**
          * `FunctionCall`
          * `EvaluateScript`
          * `MajorGC`
          * `MinorGC`
          * `GCEvent`
      * **Styles**
          * `UpdateLayoutTree`
          * `RecalculateStyles`
          * `ParseAuthorStyleSheet`
      * **Update Layer Tree**
          * `UpdateLayerTree`
      * **Layout**
          * `Layout`
      * **Paint**
          * `Paint`
      * **Raster**
          * `RasterTask`
          * `Rasterize`
      * **Composite Layers**
          * `CompositeLayers`
* For each slice:
    * Sum the slices of each type, and store against the Action
* For each thread, locate events within each “window of interest” that match the following:
    * DOMContentLoaded
        * `MarkDOMContent`
    * First Paint
        * `MarkFirstPaint`
    * Load
        * `MarkLoad`
    * Frame
        * `DrawFrame`

## Import Rules

The following captures the rules around importing a trace.

1. A **Project** has a secret.
2. All **Actions** have IDs.
3. If a trace is submitted, the submitter must provide the secret. If not, the trace will be rejected.
4. If a trace is submitted, the submitter may also provide a collection of IDs, which will be used to identify the **Action** (or **Action**s) to which to the trace refers.
5. If a single label is provided and the **Action** of that label is for a Load **Action**, the trace is considered to match entirely to the **Action**. If the **Action** is not a Load **Action**, then only the ranges will be matched.
6. If the **Action** of that label is not a Load **Action**, then look for time ranges of that label.
7. If multiple labels are provided and the trace contains ranges, those ranges will be mapped to existing **Action**s in the Project with those labels.
8. If multiple labels are provided and the trace does not contain ranges, no **Action**s will be findable, so the import will be a no-op. If, however, only one of the labels provided is for a Load **Action**, then the trace will be assumed to match to that **Action**.
9. If no labels are provided and no ranges exist, then a match will be assumed if and only if there is one Load **Action** in the Project. If time ranges do exist, then Actions will be created for those time ranges as necessary during the import.

Please note: this is not an official Google product.
