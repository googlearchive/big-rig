#!/usr/bin/env python
#
# Copyright 2015 Google Inc.
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

import os
import sys
import re
import base64
import webapp2
import jinja2
import json

from datetime import datetime
from datetime import timedelta
from jinja2 import Environment, meta
from random import randint

from google.appengine.api import users
from google.appengine.api import taskqueue
from google.appengine.ext import blobstore
from google.appengine.ext import ndb
from google.appengine.ext.ndb import model
from google.appengine.ext.webapp import blobstore_handlers
from google.appengine.ext import vendor
vendor.add('thirdparty')

from bigrig.models import Project
from bigrig.models import Action
from bigrig.models import ActionDetail
from bigrig.models import Log
from bigrig.models import Trace
from bigrig.models import Subscription
from bigrig.models import SubscriptionMessage
from bigrig.processor import TraceProcessor
from bigrig.usermanager import UserManager

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(
        os.path.join(
          os.path.dirname(__file__), '..'
        )
      ),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)

class DebugHandler(webapp2.RequestHandler):
  def get(self):

    secret = self.request.get('secret')
    labels = self.request.get('labels')
    trace_key = self.request.get('trace')

    if (trace_key == ''):
      self.response.write('no trace key')
      return

    trace = Trace.get_by_id(int(trace_key))

    if (secret == ''):
      self.response.write("no secret")
      return

    if (trace == None):
      self.response.write("no trace")
      return

    project = Project.query().filter(Project.secret==secret).get()

    if (project == None):
      self.response.write("no project")
      return

    labels_list = labels.split(',')
    labels_list_stringified = '"' + '","'.join(labels_list) + '"'

    if (labels == ''):
      labels_list_stringified = ''

    data = '{"secret":"' + secret + '", "labels": [' + labels_list_stringified + ']}'
    data_json = json.loads(data)

    blob_reader = blobstore.BlobReader(trace.file_key)
    TraceProcessor().process(project, blob_reader.read(), trace, data_json)


class TraceUploadHandler(blobstore_handlers.BlobstoreUploadHandler):

  def get(self):

    self.response.headers.add_header('Access-Control-Allow-Origin', '*')

    template = JINJA_ENVIRONMENT.get_template('templates/_endpoints/action-update.json')

    project_secret = self.request.get('secret')
    project = Project.query().filter(Project.secret==project_secret).get()

    if (project == None):
      self.response.write(template.render({
        "message": "No secret provided"
      }))
      return

    self.response.write(template.render({
      "message": blobstore.create_upload_url('/action/import')
    }))


  def post(self):

    # Allow all and sundry to post here, we're going to use the secret as
    # the method of accepting or denying posts.
    self.response.headers.add_header('Access-Control-Allow-Origin', '*')

    template = JINJA_ENVIRONMENT.get_template('templates/_endpoints/action-update.json')
    data = self.request.get('data')
    delete_trace_after_import = True
    json_decode_error = False
    chunks_indicator = '=\r?\n'

    # Just see if AppEngine is treating the data like chunked encoding.
    # If the data contains chunks, or seems to, remove it.
    if re.search(chunks_indicator, data):
      data = re.sub(chunks_indicator, '', data)

    # Try and parse the posted JSON
    try:
      data_json = json.loads(data)
    except Exception, e:
      self.response.write(template.render({
        "message": 'Unable to parse data'
      }))
      return

    # Check that there is a secret
    if not 'secret' in data_json:
      self.response.write(template.render({
        "message": "No secret provided"
      }))
      return

    if not 'labels' in data_json:
      data_json['labels'] = ''

    project_secret = data_json['secret']

    if 'delete-trace-after-import' in data_json:
      delete_trace_after_import = (
          data_json['delete-trace-after-import'] == 'true')

    uploads = self.get_uploads()

    if (len(uploads) == 0):
      self.response.write(template.render({
        "message": "No upload found."
      }))
      return

    upload = uploads[0]
    blob_info = blobstore.BlobInfo(upload.key())

    trace = Trace(
      file_key=upload.key(),
      date=blob_info.creation,
      filename=blob_info.filename,
      processed=False,
      delete_trace_after_import=delete_trace_after_import
    )

    project = Project.query().filter(Project.secret==project_secret).get()

    if project == None:
      self.response.write(template.render({
        "message": "No project found with secret %s." % project_secret
      }))
      return

    log = Log(
      parent=project.key,
      filename=blob_info.filename,
      date=(datetime.today() - timedelta(0, 1)),
      status='File scheduled for import.',
      records_imported=-1
    )
    log.put()

    # Save.
    trace.put()

    # Schedule the processing of the trace.
    taskqueue.add(url='/process', params={
      'key': trace.key.integer_id(),
      'data': data
    })

    self.response.write(template.render({
      "message": "ok"
    }))


class TraceWorker(webapp2.RequestHandler):

  def post(self):
    key = self.request.get('key')
    data = self.request.get('data')

    if (key == None or data == None):
      return

    # We don't need a try here, because it's already been checked in the
    # import handler by this point.
    data_json = json.loads(data)
    trace = Trace.get_by_id(int(key))

    if 'secret' not in data_json:
      return

    secret = data_json['secret']
    project = Project.query().filter(Project.secret==secret).get()

    if (project == None):
      return

    if (trace == None):
      return

    @ndb.transactional(xg=True)
    def process_trace(project, trace, data_json):

      blob_reader = blobstore.BlobReader(trace.file_key)
      action_details_imported = TraceProcessor().process(project,
          blob_reader.read(), trace, data_json)

      # Tidy up the trace file if needed.
      if trace.delete_trace_after_import:
        blobstore.delete(trace.file_key)
        trace.key.delete()

      return action_details_imported

    action_details_imported = process_trace(project, trace, data_json)


app = webapp2.WSGIApplication([
    ('/action/import', TraceUploadHandler),
    ('/debug', DebugHandler),
    ('/import', TraceUploadHandler),
    ('/process', TraceWorker)
], debug=True)
