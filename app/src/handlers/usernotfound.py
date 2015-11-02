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

from google.appengine.ext import vendor
vendor.add('thirdparty')

import markdown

from jinja2 import Environment, meta
from bigrig.usermanager import UserManager

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(
        os.path.join(
          os.path.dirname(__file__), '..'
        )
      ),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)

class UserNotFoundHandler(webapp2.RequestHandler):

  def get (self):

    if UserManager.get_current_user() != None:
      self.redirect('/')

    template = JINJA_ENVIRONMENT.get_template('templates/user-not-found.html')
    self.response.write(template.render({
      'sign_out_url': UserManager.get_signout_url(),
      'user_email': UserManager.get_email(),
      'sections': [{
        "name": "User not found"
      }]}))


app = webapp2.WSGIApplication([
    ('/user-not-found', UserNotFoundHandler)
], debug=True)
