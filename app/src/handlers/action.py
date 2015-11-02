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
import site
import re
import base64
import webapp2
import jinja2
import json
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

class RedirectHandler(webapp2.RequestHandler):
  def get(self):

    if UserManager.get_current_user() == None:
      self.redirect('/user-not-found')
      return

    self.redirect('/projects/list')

class ActionSaveHandler(webapp2.RequestHandler):
  def post(self):

    if UserManager.get_current_user() == None:
      self.redirect('/user-not-found')
      return

    save_message = 'ok'

    project_key_string = self.request.get('project-key')
    action_key_string = self.request.get('action-key')
    action_name = self.request.get('action-name')
    action_label = self.request.get('action-label')
    action_type = self.request.get('action-type')

    if (action_type != 'Load' and
        action_type != 'Response' and
        action_type != 'Animation'):
      action_type = 'Load'

    if (project_key_string == '' or project_key_string == None):
      save_message = 'No project key provided'
    elif (action_key_string == '' or action_key_string == None):
      save_message = 'No project key provided'
    else:

      project_key = ndb.Key(
        Project, int(project_key_string),
      )

      project = project_key.get()

      if UserManager.get_user_has_privilege_for_operation(project):

        action = Action.get_by_id(int(action_key_string),
          parent=project_key)

        action.name = action_name
        action.type = action_type
        action.label = action_label

        action.put()

      else:
        save_message = 'Permission denied.'

    template = JINJA_ENVIRONMENT.get_template('templates/_endpoints/action-update.json')
    self.response.write(template.render({
      "message": save_message
    }))

class ActionRenderOptionHandler(webapp2.RequestHandler):
  def post(self):

    if UserManager.get_current_user() == None:
      self.redirect('/user-not-found')
      return

    save_message = 'ok'

    project_key_string = self.request.get('project-key')
    action_key_string = self.request.get('action-key')
    action_x_axis = self.request.get('action-x-axis')
    action_y_axis = self.request.get('action-y-axis')

    if (project_key_string == '' or project_key_string == None):
      save_message = 'No project key provided'
    elif (action_key_string == '' or action_key_string == None):
      save_message = 'No project key provided'
    else:

      project_key = ndb.Key(
        Project, int(project_key_string),
      )

      project = project_key.get()

      if UserManager.get_user_has_privilege_for_operation(project):

        action = Action.get_by_id(int(action_key_string),
          parent=project_key)

        if (re.search('^\d+$', action_x_axis)):
          action.x_axis = int(action_x_axis)

        if (re.search('^\d+$', action_y_axis)):
          action.y_axis = int(action_y_axis)

        action.put()
      else:
        save_message = 'Permission denied.'

    template = JINJA_ENVIRONMENT.get_template('templates/_endpoints/action-update.json')
    self.response.write(template.render({
      "message": save_message
    }))

class ActionCreateHandler(webapp2.RequestHandler):
  def post(self):

    if UserManager.get_current_user() == None:
      self.redirect('/user-not-found')
      return

    save_message = 'ok'

    project_key_string = self.request.get('project-key')
    action_name = self.request.get('action-name')
    action_label = self.request.get('action-label')
    action_type = self.request.get('action-type')
    y_axis_max = 'duration'
    y_axis = 0 # Relative

    if (action_type != 'Load' and
        action_type != 'Response' and
        action_type != 'Animation'):
      action_type = 'Load'

    if (action_type == 'Animation'):
      y_axis_max = 'fps'
      y_axis = 1 # Default to absolute

    if (project_key_string == '' or project_key_string == None):
      save_message = 'No project key provided'
    else:

      project_key = ndb.Key(
        Project, int(project_key_string),
      )

      project = project_key.get()

      if UserManager.get_user_has_privilege_for_operation(project):

        action = Action(
          parent=project_key,
          name=action_name,
          type=action_type,
          label=action_label,
          x_axis=0,
          y_axis=0,
          y_axis_max=y_axis_max
        )

        action.put()
      else:
        save_message = 'Permission denied.'

    template = JINJA_ENVIRONMENT.get_template('templates/_endpoints/action-update.json')
    self.response.write(template.render({
      "message": save_message
    }))

class ActionDeleteHandler(webapp2.RequestHandler):
  def post(self):

    if UserManager.get_current_user() == None:
      self.redirect('/user-not-found')
      return

    delete_message = 'ok'

    project_key_string = self.request.get('project-key')
    action_key_string = self.request.get('action-key')

    if (project_key_string == '' or project_key_string == None):
      delete_message = 'No project key provided'
    elif (action_key_string == '' or action_key_string == None):
      delete_message = 'No project key provided'
    else:

      project_key = ndb.Key(
        Project, int(project_key_string),
      )

      project = project_key.get()

      if UserManager.get_user_has_privilege_for_operation(project):

        action = Action.get_by_id(int(action_key_string),
          parent=project_key)

        action_detail_key = ndb.Key(
          Project, int(project_key_string),
          Action, int(action_key_string)
        )

        to_delete = [action.key]
        to_delete.extend(
          ndb.Query(
            ancestor=action_detail_key
          ).iter(keys_only=True)
        )

        ndb.delete_multi(to_delete)

      else:
        delete_message = 'Permission denied.'

    template = JINJA_ENVIRONMENT.get_template('templates/_endpoints/action-update.json')
    self.response.write(template.render({
      "message": delete_message
    }))

class ActionDeleteDetailHandler(webapp2.RequestHandler):

  def post(self):

    if UserManager.get_current_user() == None:
      self.redirect('/user-not-found')
      return

    delete_message = 'ok'

    action_detail_key_string = self.request.get('action-detail-key')
    project_key_string = self.request.get('project-key')
    action_key_string = self.request.get('action-key')

    if (project_key_string == '' or project_key_string == None):
      delete_message = 'No project key provided'
    elif (action_key_string == '' or action_key_string == None):
      delete_message = 'No action key provided'
    elif (action_detail_key_string == '' or action_detail_key_string == None):
      delete_message = 'No action detail key provided'
    else:

      project_key = ndb.Key(Project, int(project_key_string))
      project = project_key.get()

      if UserManager.get_user_has_privilege_for_operation(project):

        action_detail_key = ndb.Key(
          Project, int(project_key_string),
          Action, int(action_key_string),
          ActionDetail, int(action_detail_key_string)
        )

        ndb.delete_multi([action_detail_key])
      else:
        delete_message = 'Permission denied.'

    template = JINJA_ENVIRONMENT.get_template('templates/_endpoints/action-update.json')
    self.response.write(template.render({
      "message": delete_message
    }))


app = webapp2.WSGIApplication([
    ('/', RedirectHandler),
    ('/action/save', ActionSaveHandler),
    ('/action/delete', ActionDeleteHandler),
    ('/action/create', ActionCreateHandler),
    ('/action/render-option', ActionRenderOptionHandler),
    ('/action/delete-action-detail', ActionDeleteDetailHandler)
], debug=True)
