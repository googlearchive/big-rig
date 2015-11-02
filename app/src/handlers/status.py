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

import urllib
from google.appengine.api import urlfetch

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(
        os.path.join(
          os.path.dirname(__file__), '..'
        )
      ),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)

class StatusHandler(webapp2.RequestHandler):
  def get(self):

    subscription_id_string = self.request.get('subscription-id')
    template = JINJA_ENVIRONMENT.get_template('templates/_endpoints/action-update.json')

    if subscription_id_string == '' or subscription_id_string is None:
      self.response.write('No subscription id')
      return

    subscription_message = SubscriptionMessage.query().filter(
      ).order(-SubscriptionMessage.datetime).get()

    if subscription_message is None:
      self.response.write(template.render({
        "message": "none"
      }))
      return


    json_message = {
      "title": subscription_message.title,
      "message": subscription_message.message,
      "url": subscription_message.url
    }

    ndb.delete_multi([subscription_message.key])

    self.response.write(json.dumps(json_message))


app = webapp2.WSGIApplication([
    ('/status', StatusHandler)
], debug=True)
