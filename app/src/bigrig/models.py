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

from google.appengine.ext import ndb

class User(ndb.Model):
  email = ndb.StringProperty()
  is_primary = ndb.BooleanProperty()

class Subscription(ndb.Model):
  endpoint = ndb.StringProperty(required=True)
  email = ndb.StringProperty(required=True)

class SubscriptionMessage(ndb.Model):
  endpoint = ndb.StringProperty(required=True)
  subscription_id = ndb.StringProperty(required=True)
  datetime = ndb.DateTimeProperty(required=True)
  title = ndb.StringProperty(required=True)
  message = ndb.StringProperty(required=True)
  url = ndb.StringProperty(required=True)

class Project(ndb.Model):
  name = ndb.StringProperty(required=True)
  owner = ndb.StringProperty(required=True)
  secret = ndb.StringProperty(required=True)
  visible_to_owner_only = ndb.BooleanProperty()

class Action(ndb.Model):
  name = ndb.StringProperty()
  type = ndb.StringProperty()
  label = ndb.StringProperty()
  x_axis = ndb.IntegerProperty()
  y_axis = ndb.IntegerProperty()
  y_axis_max = ndb.StringProperty()

class ActionDetailExtended(ndb.Model):
  type = ndb.StringProperty()
  name = ndb.StringProperty()
  value = ndb.StringProperty()

class ActionDetail(ndb.Model):
  parse_html = ndb.FloatProperty()
  javascript = ndb.FloatProperty()
  styles = ndb.FloatProperty()
  update_layer_tree = ndb.FloatProperty()
  layout = ndb.FloatProperty()
  paint = ndb.FloatProperty()
  raster = ndb.FloatProperty()
  composite = ndb.FloatProperty()
  frames_per_second = ndb.FloatProperty()
  date = ndb.DateTimeProperty()
  duration = ndb.FloatProperty()
  first_paint_time = ndb.FloatProperty()
  dom_content_loaded_time = ndb.FloatProperty()
  load_time = ndb.FloatProperty()
  extended_info = ndb.StructuredProperty(ActionDetailExtended, repeated=True)
  speed_index = ndb.IntegerProperty()

class Trace(ndb.Model):
  processed = ndb.BooleanProperty()
  file_key = ndb.BlobKeyProperty()
  filename = ndb.StringProperty()
  date = ndb.DateTimeProperty()
  error = ndb.StringProperty()
  process = ndb.StringProperty()
  delete_trace_after_import = ndb.BooleanProperty()

class Log(ndb.Model):
  filename = ndb.StringProperty()
  date = ndb.DateTimeProperty()
  status = ndb.StringProperty()
  records_imported = ndb.IntegerProperty()
