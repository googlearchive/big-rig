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

import hashlib

from google.appengine.api import users
from google.appengine.ext import ndb
from google.appengine.ext.ndb import model

from models import User

class UserManager():

  @staticmethod
  def create_user_account_if_possible ():

    # If the user account doesn't already exist.
    user = UserManager.get_current_user_by_email_address()

    # Check that the user's key matches the user_id from AppEngine and
    # update it if necessary. This is because accounts created in the
    # /users/ section won't have the AppEngine user id.
    current_user_id = UserManager.get_current_user_id()

    if user and user.key.id() != str(current_user_id):
      # Remove the current user, because the key is immutable
      user.key.delete()


    # Either the user exists (and we just deleted the old entry
    # in the datastore) or they don't but they're an admin. (For any other
    # kind of user we would bail out.)
    if user or UserManager.is_admin():

      user = users.get_current_user()
      new_user = User(
        id=user.user_id(),
        email=user.email(),
        is_primary=(User.query().count() == 0)
      )
      new_user.put()

      return new_user


  @staticmethod
  def get_current_user_by_email_address ():
    return User.query().filter(User.email==UserManager.get_email()).get()

  @staticmethod
  def get_user_by_email_address (email):
    return User.query().filter(User.email==email).get()

  @staticmethod
  def get_current_user_id ():
    user = users.get_current_user()
    return user.user_id()

  @staticmethod
  def get_current_user ():

    # Try getting the user
    user = ndb.Key(User, UserManager.get_current_user_id()).get()

    # If they don't exist, try creating them.
    if user == None:
      user = UserManager.create_user_account_if_possible()

    return user

  @staticmethod
  def get_user_has_privilege_for_operation (project):
    user_email = UserManager.get_email()
    return (
      (UserManager.is_admin()) or
      (not project.visible_to_owner_only) or
      (project.visible_to_owner_only and project.owner == user_email)
    )

  @staticmethod
  def is_admin ():
    return users.is_current_user_admin()

  @staticmethod
  def get_signout_url ():
    return users.create_logout_url('/')

  @staticmethod
  def get_nickname ():
    user = users.get_current_user()
    if (user == None):
      return

    return user.nickname()

  @staticmethod
  def get_email ():
    user = users.get_current_user()
    if (user == None):
      return

    return user.email()

  @staticmethod
  def get_gravatar_url ():
    user = users.get_current_user()
    if (user == None):
      return

    mdhash = hashlib.md5()
    mdhash.update(user.email().lower())
    hash = mdhash.hexdigest()

    return ('https://www.gravatar.com/avatar/%s?s=48' % hash)

