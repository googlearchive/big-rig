#!/usr/bin/env python
#
# Copyright 2007 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

import gzip
import os
import sys
import re
import json
from StringIO import StringIO
from datetime import datetime
from datetime import timedelta
from urlparse import urlparse
from dateutil.parser import parse as dateparse

from google.appengine.ext import ndb

from telemetry.timeline import model as model_module
from telemetry.timeline import trace_data as trace_data_module
from telemetry.timeline import event as trace_event

from models import Project
from models import Action
from models import ActionDetail
from models import ActionDetailExtended
from models import Log

class TraceProcessor():

  __temp_actions = {}
  __js_blame = {}

  def log (self, project, trace_info, extended_info,
          status, records_imported=0):

    if (project == None):
      return

    log = Log(
      parent=project.key,
      filename=trace_info.filename,
      date=datetime.today(),
      status=status,
      records_imported=records_imported
    )
    log.put()

  def process (self, project, trace_string, trace_info, extended_info):

    try:
      if re.search('json$', trace_info.filename):
        trace_json = json.loads(trace_string)
      elif re.search('json.gz$', trace_info.filename):
        gzip_trace_string = gzip.GzipFile(
          fileobj=StringIO(trace_string)
        ).read()
        trace_json = json.loads(gzip_trace_string)
      else:
        self.log(project, trace_info, extended_info,
          'Error reading file: neither .json nor .json.gz')
        return
    except Exception, e:
      self.log(project, trace_info, extended_info,
        'JSON parse error')
      return

    try:
      parsed_data = trace_data_module.TraceData(trace_json)
      model = model_module.TimelineModel(parsed_data)
      processes = model.GetAllProcesses()
    except Exception, e:
      self.log(project, trace_info, extended_info,
        'Error processing the file.')
      return

    summarizable = []
    trace_json = None

    # If there is a process to filter by, use that. Otherwise
    # find all non-empty and non-tracing processes and append
    # them to the list.
    if (trace_info.process != None):
      summarizable = [
        x for x in processes
        if x.labels == trace_info.process]
    else:
      for p in processes:
        if p.labels != None and p.labels != 'chrome://tracing':
          summarizable.append(p)

    # There should only be one process to process...
    if len(summarizable) == 0:
      self.log(project, trace_info, extended_info, 'No process found')
    elif len(summarizable) > 1:
      self.log(project, trace_info, extended_info,
          'Multiple tabs (trace process) found.')
    else:
      return self.analyze_trace_and_append_actions(
        project,
        trace_info,
        summarizable.pop(),
        model.bounds,
        extended_info)

  def analyze_trace_and_append_actions (self, project, trace_info, process,
      bounds, extended_info):

    threads = self.get_threads(process)
    renderer_thread = self.get_thread_by_name(process, 'CrRendererMain')
    time_ranges = self.get_time_ranges(renderer_thread)
    labels = extended_info['labels']
    secret = extended_info['secret']
    status = ''
    records_imported = 0

    if project == None:
      status = "No project found with secret %s" % secret
      return None

    # If a single label is provided...
    if (self.is_single_label(labels)):

      labels = self.wrap_labels_in_list_if_needed(labels)

      #...and the Action of that label is for a Load Action, the trace is
      # considered to match entirely to the Action. If the Action is not a
      # Load Action, then only the ranges will be matched.
      if (self.label_is_for_load_action(project, labels)):

        status = 'Single label (%s), label is for load action' % labels[0]

        # Ignore time ranges and reset to the whole window
        time_ranges = [trace_event.TimelineEvent(category='Load',
          name=labels[0],
          start=bounds.min,
          duration=(bounds.max - bounds.min))]

        records_imported = self.create_action_details_from_trace(project,
            labels, time_ranges, threads, trace_info, extended_info)

      # If the Action of that label is not a Load Action, then look for
      # time ranges of that label.
      else:

        status = 'Single label (%s), label is not for a Load Action' % labels[0]
        records_imported = self.create_action_details_from_trace(project,
            labels, time_ranges, threads, trace_info, extended_info)

    # If multiple labels are provided and the trace contains ranges,
    # those ranges will be mapped to existing Actions in the Project
    # with those labels.
    elif (self.is_multi_label(labels) and len(time_ranges) > 0):

      status = 'Multiple labels, trace contains ranges'
      records_imported = self.create_action_details_from_trace(project,
          labels, time_ranges, threads, trace_info, extended_info)

    # If multiple labels are provided and the trace does not contain ranges,
    # no Actions will be findable, so the import will be a no-op.
    elif (self.is_multi_label(labels) and len(time_ranges) == 0):

      # If, however, only one of the labels provided is for a Load Action,
      # then the trace will be assumed to match to that Action.
      action = self.get_single_load_action_from_multi_label(project, labels)

      # Only go ahead if we found a single Load Action
      if (action != None):

        status = ('Multiple labels, trace contains no ranges. '
                  'Single Load Action label found.')

        # Ignore time ranges and reset to the whole window
        time_ranges = [trace_event.TimelineEvent(category=action.name,
          name=action.label,
          start=bounds.min,
          duration=(bounds.max - bounds.min))]

        records_imported = self.create_action_details_from_trace(project,
            [action.name], time_ranges, threads, trace_info, extended_info)

    # If no labels are provided..
    elif (len(labels) == 0):

      # ...and no ranges exist, then a match will be assumed if and
      # only if there is one Load Action in the Project.
      if (len(time_ranges) == 0):

        action = self.get_single_load_action_from_project(project)

        if (action != None):

          status = ('No labels, trace contains no ranges. '
                    'Single Load Action in project found.')

          time_ranges = [trace_event.TimelineEvent(category=action.name,
            name=action.label,
            start=bounds.min,
            duration=(bounds.max - bounds.min))]

          records_imported = self.create_action_details_from_trace(project,
              [action.name], time_ranges, threads, trace_info, extended_info)

        else:
          status = ('No labels, trace contains no ranges. '
                    'Zero or multiple Load Actions found.')

      # If time ranges do exist, then Actions will be created for those time
      # ranges as necessary during the import.
      elif (len(time_ranges) > 0):

        status = ('No labels, trace contains ranges. '
                  'Actions will be created on demand.')

        records_imported = self.create_action_details_from_trace(project,
            [], time_ranges, threads, trace_info, extended_info)

    else:
      status = 'Unknown import error.'

    self.log(project, trace_info, extended_info, status, len(records_imported))

    return records_imported

  def get_threads (self, process):
    return [
      t for t in process.threads.values()
      if (t.name == 'Compositor' or
          t.name == 'CrRendererMain' or
          re.match('CompositorTileWorker', t.name))
    ]

  def get_thread_by_name (self, process, name):
    threads = [
      r for r in process.threads.values()
      if r.name == name
    ]

    if (len(threads) == 0):
      return None

    return threads[0]

  def get_time_ranges (self, thread):
    return [
      y for y in thread.GetAllEvents()
      if (y.category == 'blink.console' and
          y.thread_start != None)
    ]

  def get_label (self, labels):
    if (type(labels) is list):
      return labels[0]
    elif (type(labels) is str or type(labels) is unicode):
      return labels

  def wrap_labels_in_list_if_needed (self, labels):

    if type(labels) is list:
      return labels

    label_list = map(str, labels.split(','))
    return map(str.strip, label_list)


  def is_single_label (self, labels):
    return (type(labels) is str or
            type(labels) is unicode or
            (type(labels) is list and len(labels) == 1))

  def is_multi_label (self, labels):
    return (type(labels) is list and len(labels) > 1)

  def label_is_for_load_action (self, project, labels):

    if not self.is_single_label(labels):
      return False

    label = self.get_label(labels)
    action = Action.query(ancestor=project.key).filter(
        Action.label==label).get()
    return (action != None and action.type == 'Load')

  def get_single_load_action_from_project (self, project):

    # Check all Actions.
    actions = Action.query(ancestor=project.key)
    load_action = None

    for action in actions:
      if action.type == 'Load':

        # If we've just hit the first Load Action, set it, otherwise
        # unset it and break out of the loop.
        if load_action == None:
          load_action = action
        else:
          load_action = None
          break

    # Return either None or the only load action
    return load_action


  def get_single_load_action_from_multi_label (self, project, labels):

    if not self.is_multi_label(labels):
      return None

    actions = Action.query(ancestor=project.key)
    load_action = None

    for action in actions:

      # Skip over any Actions that aren't in the set of labels.
      if action.name not in labels:
        continue

      if action.type == 'Load':

        # If we've just hit the first Load Action, set it, otherwise
        # unset it and break out of the loop.
        if load_action == None:
          load_action = action
        else:
          load_action = None
          break

    # Return either None or the only load action
    return load_action

  def get_action_from_label (self, label, create_action_if_needed, project):

    action = Action.query(ancestor=project.key).filter(
        Action.label==label).get()

    if (action == None and create_action_if_needed):

      # Create a temp store of actions created just for this run.
      if label not in self.__temp_actions:
        action = Action(parent=project.key,
            name=label,
            type='Response',
            label=label,
            x_axis=0,
            y_axis=0,
            y_axis_max='duration')

        action.put()

        self.__temp_actions[label] = action
      else:
        action = self.__temp_actions[label]

    return action

  def get_javascript_url_from_stack_info (self, slice):

    url = None

    if 'data' not in slice.args:
      return url

    if ('url' in slice.args['data'] and
        slice.args['data']['url'] != '' and
        re.search('^http', slice.args['data']['url'])):
        url = slice.args['data']['url']

    elif ('scriptName' in slice.args['data'] and
        slice.args['data']['scriptName'] != '' and
        re.search('^http', slice.args['data']['scriptName'])):

        url = slice.args['data']['scriptName']

    return url

  def create_action_details_from_trace (self, project, labels, time_ranges,
      threads, trace_info, extended_info):

    if (type(labels) is not list):
      return []

    results = {}
    first_paint_time = None
    dom_content_loaded_time = None
    load_time = None
    create_action_if_needed = (len(labels) == 0)
    to_save = []

    def sum(l):
      total = 0
      for v in l:
        total += v
      return total

    # Default the trace date to the time the blob was uploaded.
    trace_date = trace_info.date
    if ('datetime' in extended_info):
      try:
        # Get the date, parse it, and set back to UTC for AppEngine
        trace_date = dateparse(extended_info['datetime'])
        trace_date = trace_date.replace(tzinfo=None) + trace_date.utcoffset()
      except Exception, e:
        # Fail nicely
        trace_date = trace_info.date

    speed_index = -1
    if ('speed-index' in extended_info):
      try:
        speed_index = int(extended_info['speed-index'])
      except Exception, e:
        # No need to worry. If we get a non-numeric speed index, ignore it.
        speed_index = -1

    # Step 1: go through all time ranges, and match to the correct Action.
    for time_range in time_ranges:

      name = time_range.name

      # Try and find the action. If we're unsuccessful, bail out from this
      # time range and move to the next one.
      action = self.get_action_from_label(name,
          create_action_if_needed, project)

      if (action == None):
        continue

      result = {
        'Duration': time_range.duration,
        'Frames': 0,
        'ParseHTML': [],
        'JavaScript': [],
        'Styles': [],
        'UpdateLayerTree': [],
        'Layout': [],
        'Paint': [],
        'Raster': [],
        'Composite': []
      }

      result_extended_info = {
        'JavaScript': {}
      }

      # If there's a commit ID in the post, add that as an extended item.
      if 'commit' in extended_info:
        result_extended_info['commit'] = {
          "commit": extended_info['commit']
        }

      # Same goes for the WPT id.
      if 'webpagetest-id' in extended_info:
        result_extended_info['webpagetest-id'] = {
          "webpagetest-id": extended_info['webpagetest-id']
        }

      # Step through each thread.
      for t in threads:

        # Start with the events for the thread.
        for q in t.GetAllEvents():

          # In the events there should be DOMContentLoaded etc.
          if q.name == "MarkDOMContent" and dom_content_loaded_time == None:
            dom_content_loaded_time = q.start
          elif q.name == "MarkFirstPaint" and first_paint_time == None:
            first_paint_time = q.start
          elif q.name == "MarkLoad" and load_time == None:
            load_time = q.start

          # The compositor thread may have the frame info, so we'll use that.
          elif (q.name == 'DrawFrame' and
                q.start > time_range.start and
                q.start <= time_range.start + time_range.duration):
            result['Frames'] += 1

        # Then jump to the slices.
        for s in t.IterAllSlicesInRange(time_range.start,
            time_range.start + time_range.duration):

          # Get the thread duration if possible, and the duration if not.
          duration = self.get_best_duration_for_slice(s)

          # Same for the immediate children.
          children_duration = self.get_immediate_child_slice_durations(s)

          if s.name == 'ParseHTML':
            result['ParseHTML'].append(duration)
          elif (s.name == 'FunctionCall' or
                s.name == 'EvaluateScript' or
                s.name == 'MajorGC' or
                s.name == 'MinorGC' or
                s.name == 'GCEvent'):
            result['JavaScript'].append(duration)

            # If we have JS Stacks find out who the culprits are for the
            # JavaScript that is running.
            owner_domain = self.get_javascript_url_from_stack_info(s)
            if owner_domain != None:

              # Parse the domain
              parsed_owner_domain = urlparse(owner_domain)
              domain = parsed_owner_domain.netloc

              if domain not in result_extended_info['JavaScript']:
                result_extended_info['JavaScript'][domain] = 0

              result_extended_info['JavaScript'][domain] += duration

          elif (s.name == 'UpdateLayoutTree' or
                s.name == 'RecalculateStyles' or
                s.name == 'ParseAuthorStyleSheet'):
            result['Styles'].append(duration)
          elif s.name == 'UpdateLayerTree':
            result['UpdateLayerTree'].append(duration)
          elif s.name == 'Layout':
            result['Layout'].append(duration)
          elif (s.name == 'Paint'):
            result['Paint'].append(duration)
          elif (s.name == 'RasterTask' or
                s.name == 'Rasterize'):
            result['Raster'].append(duration)
          elif (s.name == 'CompositeLayers'):
            result['Composite'].append(duration)

      # Step 2: Summarize
      timeInSeconds = result['Duration'] / float(1000)

      if (timeInSeconds == 0):
        timeInSeconds = 1

      fps = result['Frames'] / timeInSeconds

      action_details_extended_info = []
      for extended_type, entry in result_extended_info.iteritems():
        for extended_name, extended_value in entry.iteritems():
          action_detail_extended = ActionDetailExtended(
            type=extended_type,
            name=extended_name,
            value=str(extended_value)
          )

          # Append it to the list of items that need to be referenced
          # by the ActionDetail that's about to be created.
          action_details_extended_info.append(action_detail_extended)

      action_detail = ActionDetail(
        parent=action.key,
        duration=result['Duration'],
        parse_html=sum(result['ParseHTML']),
        javascript=sum(result['JavaScript']),
        styles=sum(result['Styles']),
        update_layer_tree=sum(result['UpdateLayerTree']),
        layout=sum(result['Layout']),
        paint=sum(result['Paint']),
        raster=sum(result['Raster']),
        composite=sum(result['Composite']),
        frames_per_second=fps,
        date=(trace_date + timedelta(0, 0, 0, time_range.start)),
        first_paint_time=first_paint_time,
        dom_content_loaded_time=dom_content_loaded_time,
        load_time=load_time,
        speed_index=speed_index
      )

      # If there's any extended info for this ActionDetail, append it now.
      if (len(action_details_extended_info)):
        action_detail.extended_info = action_details_extended_info

      # Add this action to the list of things to be saved
      to_save.append(action_detail)

    # Step 3: Store the ActionDetails
    if (len(to_save) > 0):
      ndb.put_multi(to_save)

    return to_save

  def get_best_duration_for_slice (self, slice):

    duration = 0
    if (slice.thread_duration != None):
      duration = slice.thread_duration
    elif (slice.duration != None):
      duration = slice.duration

    return duration


  def get_immediate_child_slice_durations (self, slice):

    duration = 0
    for s in slice.sub_slices:
      if (s.thread_duration != None):
        duration += s.thread_duration
      elif (s.duration != None):
        duration += s.duration

    return duration
