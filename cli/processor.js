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

var URL = require('url');

function analyzeTrace (contents) {

  var events = [JSON.stringify({
    traceEvents: JSON.parse(contents)
  })];

  var model = convertEventsToModel(events);
  var processes = model.getAllProcesses();
  var trace_process = null;
  var summarizable = [];

  for (var p = 0; p < processes.length; p++) {
    var candidate = processes[p];
    if (typeof candidate.labels != 'undefined' &&
        candidate.labels.length > 0 &&
        candidate.labels[0] !== 'chrome://tracing') {
      summarizable.push(candidate);
    }
  }

  if (summarizable.length == 0)
    throw "Zero processes found";
  if (summarizable.length > 1)
    throw "Multiple processes found";

  trace_process = summarizable.pop();
  results = processTrace(model, trace_process);

  // RAIL analysis.
  var modelHelper = new tr.e.audits.ChromeModelHelper(model);
  var rirf = new tr.e.rail.RAILIRFinder(model, modelHelper);
  model.interactionRecords = rirf.findAllInteractionRecords();

  results['RAIL Score'] =
    tr.e.rail.RAILScore.fromModel(model).overallScore.toFixed(4);

  return results;
}

function convertEventsToModel (events) {

  var io = new tr.importer.ImportOptions();
  io.showImportWarnings = false;
  io.shiftWorldToZero = true;
  io.pruneEmptyContainers = false;

  var model = new tr.Model();
  var importer = new tr.importer.Import(model, io);
  importer.importTraces(events);
  return model;
}

function processTrace (model, trace_process) {

  var threads = getThreads(trace_process);
  var rendererThread = getThreadByName(trace_process, 'CrRendererMain');

  if (!rendererThread)
    throw "Can't find renderer thread";

  var timeRanges = getTimeRanges(rendererThread);

  if (timeRanges.length === 0)
    timeRanges = [{
      category: 'Load',
      name: 'Full',
      start: model.bounds.min,
      duration: (model.bounds.max - model.bounds.min)
    }];

  return createActionDetailsFromTrace(timeRanges, threads);
}

function createActionDetailsFromTrace (timeRanges, threads) {

  var result = {
    "Duration": timeRanges[0].duration,
    // "Frames": 0,
    "ParseHTML": 0,
    "JavaScript": 0,
    "Styles": 0,
    "UpdateLayerTree": 0,
    "Layout": 0,
    "Paint": 0,
    "Raster": 0,
    "Composite": 0,
    "ExtendedInfo": {
      "JavaScript": {

      }
    }
  };

  threads.forEach(function(thread, index) {

    var slices = thread.sliceGroup.topLevelSlices;
    var slice = null;
    var duration = 0;

    for (var s = 0 ; s < slices.length; s++) {
      slice = slices[s];
      slice.iterateAllDescendents(function (subslice) {
        addDurationToResult(subslice, result);
      });
    }

  });

  return result;
}

function getJavascriptUrlFromStackInfo (slice) {
  var url = null;

  if (typeof slice.args['data'] === 'undefined')
    return url;

  // Check for the URL in the slice.
  // Failing that, look for scriptName.
  if (typeof slice.args['data']['url'] !== 'undefined' &&
      slice.args['data']['url'] !== '' &&
      /^http/.test(slice.args['data']['url'])) {

    url = slice.args['data']['url'];
  } else if (typeof slice.args['data']['scriptName'] !== 'undefined' &&
      slice.args['data']['scriptName'] != '' &&
      /^http/.test(slice.args['data']['scriptName'])) {

    url = slice.args['data']['scriptName'];
  }

  return url;
}

function addDurationToResult (slice, result) {

  var duration = getBestDurationForSlice(slice);

  if (slice.title == 'ParseHTML')
    result['ParseHTML'] += duration;
  else if (slice.title == 'FunctionCall' ||
          slice.title == 'EvaluateScript' ||
          slice.title == 'MajorGC' ||
          slice.title == 'MinorGC' ||
          slice.title == 'GCEvent') {
    result['JavaScript'] += duration;
  }

    // # If we have JS Stacks find out who the culprits are for the
    // # JavaScript that is running.
    var owner = getJavascriptUrlFromStackInfo(slice);
    if (owner !== null) {
      var url = URL.parse(owner);
      var host = url.host;

      if (!result.ExtendedInfo.JavaScript[host])
        result.ExtendedInfo.JavaScript[host] = 0;

      result.ExtendedInfo.JavaScript[host] += duration;
    }

  else if (slice.title == 'UpdateLayoutTree' ||
           slice.title == 'RecalculateStyles' ||
           slice.title == 'ParseAuthorStyleSheet')
    result['Styles'] += duration;
  else if (slice.title == 'UpdateLayerTree')
    result['UpdateLayerTree'] += duration;
  else if (slice.title == 'Layout')
    result['Layout'] += duration;
  else if (slice.title == 'Paint')
    result['Paint'] += duration;
  else if (slice.title == 'RasterTask' ||
           slice.title == 'Rasterize')
    result['Raster'] += duration;
  else if (slice.title == 'CompositeLayers')
    result['Composite'] += duration;
}

function getBestDurationForSlice (slice) {

  var duration = 0;
  if (typeof slice.cpuDuration !== 'undefined')
    duration = slice.cpuDuration;

  return duration;
}

function getThreads (trace_process) {

  var threadKeys = Object.keys(trace_process.threads);
  var threadKey = null;
  var threads = [];
  var thread = null;

  for (var t = 0; t < threadKeys.length; t++) {
    threadKey = threadKeys[t];
    thread = trace_process.threads[threadKey];

    if (thread.name === 'Compositor' ||
        thread.name === 'CrRendererMain' ||
        thread.name.indexOf('CompositorTileWorker') >= 0) {

      threads.push(thread);
    }
  }

  return threads;
}

function getThreadByName (trace_process, name) {

  var threadKeys = Object.keys(trace_process.threads);
  var threadKey = null;
  var threads = [];
  var thread = null;

  for (var t = 0; t < threadKeys.length; t++) {
    threadKey = threadKeys[t];
    thread = trace_process.threads[threadKey];

    if (thread.name === name)
      return thread;
  }

  return null;
}

function getTimeRanges (thread) {

  var timeRanges = [];
  thread.iterateAllEvents(function(evt) {
    if (evt.category == 'blink.console' && typeof evt.start === 'number') {
      timeRanges.push(evt);
    }
  });

  return timeRanges;
}

module.exports = {
  analyzeTrace: analyzeTrace
};
