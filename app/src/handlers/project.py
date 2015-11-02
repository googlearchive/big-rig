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
    self.redirect('/project/list')

class ProjectDeleteHandler(webapp2.RequestHandler):
  def post(self):

    if UserManager.get_current_user() == None:
      self.redirect('/user-not-found')
      return

    delete_message = 'ok'

    project_key_string = self.request.get('project-key')

    if (project_key_string == '' or project_key_string == None):
      delete_message = 'No project key provided'
    else:

      project = Project.get_by_id(int(project_key_string))

      if UserManager.get_user_has_privilege_for_operation(project):

        project_key = ndb.Key(Project, project.key.integer_id())
        actions = Action.query(ancestor=project_key)

        # Start with the project
        to_delete = [project.key]

        # No find all its actions
        for action in actions:

          # Add those to the list
          to_delete.append(action.key)

          # Now get all the action details
          action_detail_key = ndb.Key(
            Project, project.key.integer_id(),
            Action, action.key.integer_id()
          )

          action_details = ActionDetail.query(ancestor=action_detail_key)

          for action_detail in action_details:
            to_delete.append(action_detail.key)

        ndb.delete_multi(to_delete)

      else:
        delete_message = 'Permission denied.'

    template = JINJA_ENVIRONMENT.get_template('templates/_endpoints/action-update.json')
    self.response.write(template.render({
      "message": delete_message
    }))

class ProjectEditHandler(webapp2.RequestHandler):
  def post(self):

    if UserManager.get_current_user() == None:
      self.redirect('/user-not-found')
      return

    save_message = 'ok'

    project_key_string = self.request.get('project-key')
    project_name = self.request.get('project-name')
    project_visible_to_owner_only = (
      self.request.get('project-visible-to-owner-only') == 'on')

    if (project_key_string == '' or project_key_string == None):
      save_message = 'No project key provided'
    else:

      project = Project.get_by_id(int(project_key_string))
      if project == None:
        save_message = 'No project found'
      else:

        if UserManager.get_user_has_privilege_for_operation(project):
          project.name = project_name
          project.visible_to_owner_only = project_visible_to_owner_only

          project.put()
        else:
          save_message = 'Permission denied.'

    template = JINJA_ENVIRONMENT.get_template('templates/_endpoints/action-update.json')
    self.response.write(template.render({
      "message": save_message
    }))

class ProjectCreateHandler(webapp2.RequestHandler):
  def post(self):

    if UserManager.get_current_user() == None:
      self.redirect('/user-not-found')
      return

    save_message = 'ok'

    project_name = self.request.get('project-name')
    project_visible_to_owner_only = (self.request.get(
        'project-visible-to-owner-only') == 'on')

    if (project_name == '' or project_name == None):
      save_message = 'No project name provided'
    else:

      project = Project(
        name=project_name,
        owner=UserManager.get_email(),
        visible_to_owner_only=project_visible_to_owner_only,
        secret=base64.b64encode(os.urandom(48))
      )

      project.put()

    template = JINJA_ENVIRONMENT.get_template('templates/_endpoints/project-create.json')
    self.response.write(template.render({
      "message": save_message
    }))

class ProjectListHandler(webapp2.RequestHandler):
  def get(self):

    if UserManager.get_current_user() == None:
      self.redirect('/user-not-found')
      return

    template = JINJA_ENVIRONMENT.get_template('templates/project/project.html')
    self.response.write(template.render({
      'projects': Project.query(),
      'sign_out_url': UserManager.get_signout_url(),
      'gravatar_url': UserManager.get_gravatar_url(),
      'user_email': UserManager.get_email(),
      'user_is_admin': UserManager.is_admin(),
      'sections': [{
        "name": "Projects"
      }]
    }))

class ProjectActionListHandler(webapp2.RequestHandler):

  def get(self, key):

    if UserManager.get_current_user() == None:
      self.redirect('/user-not-found')
      return

    project = Project.get_by_id(int(key))

    if project == None:
      self.redirect('/')
      return

    if not UserManager.get_user_has_privilege_for_operation(project):
      self.redirect('/')
      return

    project_key = ndb.Key(Project, int(key))
    template_path = 'templates/project/action.html'
    data = {
      'project_key': key,
      'project_secret': project.secret,
      'logs': Log.query(ancestor=project_key).order(-Log.date).fetch(5),
      'actions': Action.query(ancestor=project_key).order(Action.name),
      'action_upload_url': blobstore.create_upload_url('/action/import'),
      'sign_out_url': UserManager.get_signout_url(),
      'gravatar_url': UserManager.get_gravatar_url(),
      'user_email': UserManager.get_email(),
      'user_is_admin': UserManager.is_admin(),
      'sections': [{
        "name": "Projects",
        "url": "/project/list"
      },{
        "name": project.name
      }]
    }

    template = JINJA_ENVIRONMENT.get_template(template_path)
    self.response.write(template.render(data))

class ProjectActionDetailHandler(webapp2.RequestHandler):

  def get (self, url):

    if UserManager.get_current_user() == None:
      self.redirect('/user-not-found')
      return

    search = re.search('^([0-9A-Za-z\-]+)/([0-9A-Za-z\-]+)/(json)?', url)
    project_key_string = search.group(1)
    action_key_string = search.group(2)
    is_json = (search.group(3) == 'json')

    action_key = ndb.Key(
      Project, int(project_key_string),
    )
    action_detail_key = ndb.Key(
      Project, int(project_key_string),
      Action, int(action_key_string)
    )

    project = Project.get_by_id(int(project_key_string))

    if not UserManager.get_user_has_privilege_for_operation(project):
      self.redirect('/')
      return

    action = Action.get_by_id(int(action_key_string),
      parent=action_key)

    if (action == None):
      self.redirect('/project/%s/' % project_key_string)
      return

    template_path = 'templates/project/action-detail.html'

    if (is_json):
      template_path = 'templates/_endpoints/chart-data.json'

    actions = ActionDetail.query(ancestor=action_detail_key).order(
        -ActionDetail.date)

    data = {
      'action_name': action.name,
      'action_type': action.type,
      'action_label': action.label,
      'action_x_axis': action.x_axis,
      'action_y_axis': action.y_axis,
      'action_y_axis_max': action.y_axis_max,
      'action_upload_url': blobstore.create_upload_url('/action/import'),
      'action_key': action_key_string,
      'project_key': project_key_string,
      'project_secret': project.secret,
      'actions': actions,
      'can_use_speed_index': all(a.speed_index > -1 for a in actions),
      'sign_out_url': UserManager.get_signout_url(),
      'gravatar_url': UserManager.get_gravatar_url(),
      'user_email': UserManager.get_email(),
      'user_is_admin': UserManager.is_admin(),
      'data_url': '/project/' + url + 'json',
      'sections': [{
        "name": "Projects",
        "url": "/project/list"
      },{
        "name": project.name,
        "url": "/project/%s/" % project_key_string
      }, {
        "name": action.name
      }]
    }

    def remap_extended_info(values):

      remapped_values = {}

      for v in values:

        if v.type not in remapped_values:
          remapped_values[v.type] = []

        try:

          value = {
            'name': v.name,
            'type': v.type,
            'value': float(v.value)
          }

        except Exception, e:

          if value == None:
            value = 0.0

        # print v
        remapped_values[v.type].append(value)

      if 'JavaScript' in remapped_values:
        remapped_values['JavaScript'] = (
          sorted(remapped_values['JavaScript'],
                key=lambda r: float(r['value']),
                reverse=True)
        )

      return remapped_values

    JINJA_ENVIRONMENT.filters['remap_extended_info'] = remap_extended_info
    template = JINJA_ENVIRONMENT.get_template(template_path)
    self.response.write(template.render(data))



app = webapp2.WSGIApplication([
    ('/', RedirectHandler),
    ('/project/list', ProjectListHandler),
    ('/project/create', ProjectCreateHandler),
    ('/project/delete', ProjectDeleteHandler),
    ('/project/edit', ProjectEditHandler),
    ('/project/(\d+)/?$', ProjectActionListHandler),
    ('/project/(\d+/\d+/.*)', ProjectActionDetailHandler)
], debug=True)
