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

class Navigation {

  constructor () {

    this.collapsed = true;
    this.element = document.querySelector('.nav');
    this.underlay = document.querySelector('.nav__underlay');
    this.toggleButton = document.getElementById('location__toggle');

    this.onToggleClick = this.onToggleClick.bind(this);
    this.onUnderlayClick = this.onUnderlayClick.bind(this);

    requestAnimationFrame( _ => this.element.classList.add('nav--animatable') );
    this.toggleButton.addEventListener('click', this.onToggleClick);
    this.underlay.addEventListener('click', this.onUnderlayClick);
  }

  onToggleClick (evt) {

    this.collapsed = !this.collapsed;
    if (this.collapsed) {
      this.element.classList.remove('nav--expanded');
      this.underlay.classList.remove('nav--expanded');
    } else {
      this.element.classList.add('nav--expanded');
      this.underlay.classList.add('nav--expanded');
    }
  }

  onUnderlayClick (evt) {
    this.collapsed = false;
    this.onToggleClick();
  }
}

export default new Navigation();
