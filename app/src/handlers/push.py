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
import itertools

from jinja2 import Environment, meta
from random import randint
from sets import Set
from datetime import datetime

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
from bigrig.models import Subscription
from bigrig.models import SubscriptionMessage
from bigrig.processor import TraceProcessor
from bigrig.usermanager import UserManager
from bigrig.pushmessage import PushMessage

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(
        os.path.join(
          os.path.dirname(__file__), '..'
        )
      ),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)

class PushHandler(webapp2.RequestHandler):
  def get(self):

    # Enable CORS
    self.response.headers.add_header("Access-Control-Allow-Origin", "*")

    project_key_string = self.request.get('project-key')
    action_key_string = self.request.get('action-key')

    if project_key_string == '' or project_key_string is None:
      self.response.write('No project key')
      return
    elif action_key_string == '' or action_key_string is None:
      self.response.write('No action key')
      return

    action_key = ndb.Key(Project, int(project_key_string),
        Action, int(action_key_string))

    subscriptions = Subscription.query(
        ancestor=action_key)

    for s in subscriptions:

      endpoint_parts = s.endpoint.split('/')
      subscription_id = endpoint_parts[len(endpoint_parts) - 1]

      # Pop a message in the store
      subscription_message = SubscriptionMessage(
        subscription_id=subscription_id,
        datetime=datetime.today(),
        title='Wowser!',
        message='Your new Speed Index is 3,301 (+208)',
        url='/project/5629499534213120/6473924464345088/')

      subscription_message.put()

      PushMessage.ping(s.endpoint)



app = webapp2.WSGIApplication([
    ('/push-test', PushHandler)
], debug=True)
