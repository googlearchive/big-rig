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

class SchemaHelper {

  constructor () {
    this.schemas = null;
    this.schemaTypes = null;
  }

  get schemaData () {
    return this.schemas;
  }

  set schemaData (schemas) {
    if (schemas === null) {
      throw new Error('Schemas is null');
    }

    this.schemas = schemas;
    this.schemaTypes = Object.keys(this.schemas);
  }

  connectAll (connection) {
    if (this.schemas === null) {
      throw new Error('No schemas provided.');
    }

    let schema;

    this.schemaTypes.forEach((schemaType) => {
      schema = this.schemas[schemaType];
      schema.instance = schema.factory(connection);
    });
  }

  disconnectAll () {
    this.schemaTypes.forEach((schemaType) => {
      this.schemas[schemaType].instance = null;
    });
  }

  exists (type) {
    return (typeof this.schemas[type] !== 'undefined');
  }

  getSchemaInstance (type) {
    if (typeof type === 'undefined') {
      throw new Error('Schema type not provided.');
    }

    if (typeof this.schemas[type] === 'undefined') {
      throw new Error('Unknown schema type provided: ' + type + '.');
    }

    if (typeof this.schemas[type].instance !== 'undefined') {
      return this.schemas[type].instance;
    }

    return null;
  }

  getAllTypes () {
    return this.schemaTypes;
  }
}

module.exports = new SchemaHelper();
