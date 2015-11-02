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

import ToasterInstance from '../helper/Toaster';

export default class UserHandler {

  constructor () {

    this.onConfirmCreate = this.onConfirmCreate.bind(this);
    this.onCancelCreate = this.onCancelCreate.bind(this);
    this.onConfirmDelete = this.onConfirmDelete.bind(this);
    this.onCancelDelete = this.onCancelDelete.bind(this);

    // Create a user
    this.initCreateUser();

    // Delete a user
    this.initDeleteUser();

  }

  initCreateUser () {

    if (typeof window.DialogFinder === 'undefined')
      return;

    this.createElementDialog = document.getElementById('create-user');
    this.createFormElement = this.createElementDialog.querySelector('form');
    this.createUserDialog =
        window.DialogFinder.get(this.createElementDialog);

    let createUser = document.getElementById('create-user-option');

    this.createFormElement.addEventListener('submit', (evt) => {
      evt.preventDefault();

      this.onConfirmCreate();
    });

    createUser.addEventListener('click', () => {

      if (!this.createUserDialog)
        return;

      this.createUserDialog.show(this.onConfirmCreate, this.onCancelCreate);

      let userEmail =
          this.createFormElement.querySelector('[name="user-email"]');
      userEmail.focus();
    });

  }

  initDeleteUser () {

    let deleteButtons = document.querySelectorAll('.user-delete');

    if (typeof window.DialogFinder === 'undefined')
      return;

    this.deleteElementDialog = document.getElementById('delete-user');
    this.deleteFormElement = this.deleteElementDialog.querySelector('form');
    this.deleteuserDialog =
        window.DialogFinder.get(this.deleteElementDialog);

    this.deleteFormElement.addEventListener('submit', (evt) => {
      evt.preventDefault();

      this.onConfirmDelete();
    });

    let onDeleteClick = (evt) => {
      if (!this.deleteuserDialog)
        return;

      let userEmail =
          this.deleteFormElement.querySelector('#user-email');

      userEmail.value = evt.currentTarget.dataset.userEmail;
      this.deleteuserDialog.show(this.onConfirmDelete, this.onCancelDelete);
    };

    for (let d = 0; d < deleteButtons.length; d++) {
      deleteButtons[d].addEventListener('click', onDeleteClick)
    }
  }

  onConfirmCreate () {

    if (this.createFormElement.querySelector('[name="user-email"]')
        .value.trim() === '')
      return;

    if (!this.createFormElement.checkValidity())
      return;

    this.createUserDialog.pending();
    this.postMessage(this.createFormElement,
        this.createFormElement.getAttribute('action'));
  }

  onCancelCreate () {
    this.createUserDialog.hide();
  }

  onConfirmDelete () {
    this.deleteuserDialog.pending();
    this.postMessage(this.deleteFormElement,
        this.deleteFormElement.getAttribute('action'));
  }

  onCancelDelete () {
    this.deleteuserDialog.hide();
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

new UserHandler();
