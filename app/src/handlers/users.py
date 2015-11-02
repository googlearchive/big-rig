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
import webapp2
import jinja2
import codecs
import re

from google.appengine.ext import ndb

from jinja2 import Environment, meta
from bigrig.models import Project
from bigrig.models import User
from bigrig.usermanager import UserManager

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(
        os.path.join(
          os.path.dirname(__file__), '..'
        )
      ),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)

class UsersCreateHandler(webapp2.RequestHandler):

  def post (self):

    if UserManager.get_current_user() == None:
      self.redirect('/user-not-found')
      return

    save_message = 'ok'
    user_email = self.request.get('user-email')

    if (user_email == '' or user_email == None):
      save_message = 'No email address provided.'
    elif (UserManager.get_user_by_email_address(user_email) != None):
      save_message = 'User already exists.'
    else:
      user = User(email=user_email)
      user.put()

    template = JINJA_ENVIRONMENT.get_template('templates/_endpoints/action-update.json')
    self.response.write(template.render({
      "message": save_message
    }))


class UsersDeleteHandler(webapp2.RequestHandler):

  def post (self):

    if UserManager.get_current_user() == None:
      self.redirect('/user-not-found')
      return

    save_message = 'ok'

    user_email = self.request.get('user-email')

    if (user_email == '' or user_email == None):
      save_message = 'No email address provided.'
    elif (UserManager.get_user_by_email_address(user_email) == None):
      save_message = 'User does not exist.'
    else:

      projects_to_reassign = Project.query().filter(Project.owner==user_email)
      to_update = []

      for project in projects_to_reassign:
        project.owner = UserManager.get_email()
        to_update.append(project)

      if len(to_update) > 0:
        ndb.put_multi(to_update)

      user = UserManager.get_user_by_email_address(user_email)
      user.key.delete()

    template = JINJA_ENVIRONMENT.get_template('templates/_endpoints/action-update.json')
    self.response.write(template.render({
      "message": save_message
    }))


class UsersHandler(webapp2.RequestHandler):

  def get (self):

    if UserManager.get_current_user() == None:
      self.redirect('/user-not-found')
      return

    if not UserManager.is_admin():
      self.redirect('/')
      return

    template = JINJA_ENVIRONMENT.get_template('templates/users/users.html')

    def is_user_admin(user):

      values = sorted(values, key=lambda r: r.value, reverse=True)
      remapped_values = itertools.groupby(values, key=lambda v: v.type)

      return remapped_values

    JINJA_ENVIRONMENT.filters['is_user_admin'] = is_user_admin

    self.response.write(template.render({
      'users': User.query(),
      'sign_out_url': UserManager.get_signout_url(),
      'gravatar_url': UserManager.get_gravatar_url(),
      'user_email': UserManager.get_email(),
      'user_is_admin': UserManager.is_admin(),
      'sections': [{
        "name": "Users"
      }]
    }))


app = webapp2.WSGIApplication([
    ('/users/', UsersHandler),
    ('/users/create', UsersCreateHandler),
    ('/users/delete', UsersDeleteHandler)
], debug=True)
