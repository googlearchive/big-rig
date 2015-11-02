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

class SubscriptionHandler(webapp2.RequestHandler):
  def post(self, url):

    if UserManager.get_current_user() == None:
      self.redirect('/user-not-found')
      return

    message = 'ok'

    project_key_string = self.request.get('project-key')
    action_key_string = self.request.get('action-detail-key')
    endpoint = self.request.get('endpoint')
    subscription_id = self.request.get('subscription-id')
    email = UserManager.get_email()

    if (project_key_string == '' or project_key_string == None):
      message = 'No project key provided'
    elif (action_key_string == '' or action_key_string == None):
      message = 'No action key provided'
    elif (endpoint == '' or endpoint == None):
      message = 'No endpoint provided'
    else:

      project_key = ndb.Key(
        Project, int(project_key_string),
      )

      project = project_key.get()

      if UserManager.get_user_has_privilege_for_operation(project):

        action_key = ndb.Key(Project, int(project_key_string),
            Action, int(action_key_string))
        subscription = Subscription.query(ancestor=action_key).filter(
              ndb.query.AND(
                Subscription.email==email,
                Subscription.endpoint==endpoint
              )
            ).get()

        if url == 'unsubscribe' and subscription is not None:
          ndb.delete_multi([subscription.key])
        elif url == 'subscribe' and subscription is None:
          message = 'new'

          subscription = Subscription(
              parent=action_key,
              endpoint=endpoint,
              email=email)

          subscription.put()

      else:
        message = 'Permission denied.'

    template = JINJA_ENVIRONMENT.get_template('templates/_endpoints/action-update.json')
    self.response.write(template.render({
      "message": message
    }))


app = webapp2.WSGIApplication([
    ('/(subscribe)', SubscriptionHandler),
    ('/(unsubscribe)', SubscriptionHandler)
], debug=True)
