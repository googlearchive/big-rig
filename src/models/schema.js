/**
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

class Schema {

  get collectionName () {
    throw new Error('Cannot instantiate collection; no collection name.');
  }

  get schema () {
    throw new Error('Schema should be subclassed with a proper schema.');
  }

  factory (connection) {
    return connection.model(this.collectionName, this.schema);
  }
}

module.exports = Schema;
