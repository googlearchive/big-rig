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

export default class ActionHandler {

  constructor () {

    var actionSelector = document.getElementById('action-options-selector');
    var createAction = actionSelector.querySelector('[for="create-action"]');
    var noActions = document.querySelector('.no-actions-button');

    this.onConfirmCreate = this.onConfirmCreate.bind(this);
    this.onCancelCreate = this.onCancelCreate.bind(this);

    if (typeof window.DialogFinder === 'undefined')
      return;

    this.createElement = document.getElementById('create-action');
    this.createFormElement = this.createElement.querySelector('form');
    this.createActionDialog =
        window.DialogFinder.get(this.createElement);

    if (!this.createActionDialog)
      return;

    let actionName = this.createFormElement.querySelector('#action-name');
    let actionLabel = this.createFormElement.querySelector('#action-label');
    let onActionNameInput = (evt) => {

      actionLabel.value = actionName.value
          .replace(/\W/gi, ' ')
          .replace(/\s{2,}/gi, ' ')
          .trim()
          .replace(/\s/gi, '-')
          .toLowerCase();

      // Force the labels to do the right thing
      actionLabel.parentElement.classList.add('is-dirty');
    }
    onActionNameInput();

    actionName.addEventListener('input', onActionNameInput);

    // Remove the listener on the action label if the user enters something
    // to the field directly.
    actionLabel.addEventListener('input', (evt) => {

      if (actionLabel.value === '')
        actionName.addEventListener('input', onActionNameInput);
      else
        actionName.removeEventListener('input', onActionNameInput);

    });

    this.createFormElement.addEventListener('submit', (evt) => {

      evt.preventDefault();

      this.onConfirmCreate();
    });

    let onCreateNewActionClick = () => {
      this.createActionDialog.show(this.onConfirmCreate, this.onCancelCreate);
    }

    createAction.addEventListener('click', onCreateNewActionClick);

    if (noActions)
      noActions.addEventListener('click', onCreateNewActionClick);

  }

  onConfirmCreate (evt) {

    if (document.getElementById('action-name').value.trim() === '')
      return;

    if (document.getElementById('action-label').value.trim() === '')
      return;

    if (!this.createFormElement.checkValidity())
      return;

    if (typeof evt !== 'undefined')
      evt.preventDefault();

    this.createActionDialog.pending();
    this.postMessage(this.createFormElement, '/action/create');
  }

  onCancelCreate () {
    this.createActionDialog.hide();
  }

  postMessage (formElement, url) {
    let xhr = new XMLHttpRequest();
    let formData = new FormData(formElement);

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        if (xhr.response.status == 'ok') {
          setTimeout( () => window.location = '', 1000 );
        } else {
          alert("Failed to perform action: " + xhr.response.status);
        }
      } else {
        // TODO(paullewis) Do a better warning.
        alert("Failed to perform action");
      }
    });
    xhr.responseType = 'json';
    xhr.open('post', url);
    xhr.send(formData);
  }
}

new ActionHandler();
