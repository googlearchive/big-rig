/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

class Layout {
  constructor () {
    this.screenSizeMediaQuery = window.matchMedia('(max-width: 850px)');

    this.onResize = this.onResize.bind(this);
    this.onResize();

    this.addEventListeners();
  }

  addEventListeners () {
    window.addEventListener('resize', this.onResize);
  }

  removeEventListeners () {
    window.removeEventListener('resize', this.onResize);
  }

  onResize (evt) {

    if (this.screenSizeMediaQuery.matches) {
      document.body.classList.add('container--small');
    } else {
      document.body.classList.remove('container--small');
    }
  }
}

export default new Layout();
