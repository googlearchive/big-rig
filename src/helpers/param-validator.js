'use strict';

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

/**
 * This class is designed to offer helper methods that validate function
 * parameters
 *
 * @author: gauntface
 */
class ParamValidator {

  /**
   * This method expects an object and an array of objects of
   * the following format:
   *
   * [{name: '<Param Name>', type: '<string | number>'}]
   *
   */
  validateParameters (obj, requiredParameters) {
    for (let i = 0; i < requiredParameters.length; i++) {
      let requiredParamKey = requiredParameters[i].name;
      let requiredParamType = requiredParameters[i].type;
      let parameterValue = obj[requiredParamKey];
      if ((typeof parameterValue) === 'undefined' ||
        parameterValue === null
      ) {
        throw new Error('Missing required parameter [' +
          requiredParamKey + ']');
      }

      if ((typeof parameterValue) !== requiredParamType) {
        throw new Error('Incorrect type for [' + requiredParamKey +
          '], found: ' +
          (typeof parameterValue) + ' was expecting: ' + requiredParamType);
      }

      if (requiredParamType === 'string' && parameterValue.length === 0) {
        throw new Error('Parameter [' + requiredParamKey + '] is empty.');
      }
    }

    return true;
  }
}

module.exports = new ParamValidator();
