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

export default class ProjectHandler {

  constructor () {

    this.onConfirmCreate = this.onConfirmCreate.bind(this);
    this.onCancelCreate = this.onCancelCreate.bind(this);
    this.onConfirmDelete = this.onConfirmDelete.bind(this);
    this.onCancelDelete = this.onCancelDelete.bind(this);
    this.onConfirmEdit = this.onConfirmEdit.bind(this);
    this.onCancelEdit = this.onCancelEdit.bind(this);
    this.onCopySecret = this.onCopySecret.bind(this);

    // Create a project
    this.initCreateProject();

    // Edit a project
    this.initEditProject();

    // Delete a project
    this.initDeleteProject();

    // Copy a project's secret
    this.initCopySecrets();

  }

  initCopySecrets () {

    let copySecretButtons = document.querySelectorAll('.project-secret-copy');

    for (let c = 0; c < copySecretButtons.length; c++) {
      copySecretButtons[c].addEventListener('click', this.onCopySecret);
    };
  }

  initCreateProject () {

    if (typeof window.DialogFinder === 'undefined')
      return;

    this.createElementDialog = document.getElementById('create-project');
    this.createFormElement = this.createElementDialog.querySelector('form');
    this.createProjectDialog =
        window.DialogFinder.get(this.createElementDialog);

    let createProject = document.getElementById('create-project-button');

    this.createFormElement.addEventListener('submit', (evt) => {
      evt.preventDefault();

      this.onConfirmCreate();
    });

    createProject.addEventListener('click', () => {
      if (!this.createProjectDialog)
        return;

      this.createProjectDialog.show(this.onConfirmCreate, this.onCancelCreate);

      let projectName =
          this.createFormElement.querySelector('[name="project-name"]');
      projectName.focus();
    });

  }

  initEditProject () {

    let editButtons = document.querySelectorAll('.project-edit');

    if (typeof window.DialogFinder === 'undefined')
      return;

    this.editElementDialog = document.getElementById('edit-project');
    this.editFormElement = this.editElementDialog.querySelector('form');
    this.editProjectDialog =
        window.DialogFinder.get(this.editElementDialog);

    this.editFormElement.addEventListener('submit', (evt) => {
      evt.preventDefault();

      this.onConfirmEdit();
    });

    let onEditClick = (evt) => {
      if (!this.editProjectDialog)
        return;

      let projectKey =
          this.editFormElement.querySelector('[name="project-key"]');

      let projectName =
          this.editFormElement.querySelector('[name="project-name"]');

      let projectVisibleOnlyToOwner =
          this.editFormElement.querySelector('[name="project-visible-only-to-owner"]');

      projectName.value = evt.currentTarget.dataset.projectName;
      projectKey.value = evt.currentTarget.dataset.projectKey;
      projectVisibleOnlyToOwner.value = evt.currentTarget.dataset.projectVisibleOnlyToOwner;

      this.editProjectDialog.show(this.onConfirmEdit, this.onCancelEdit);

      // Workaround for input field not calling 'input' or 'change' events
      // when you set their value.
      projectName.parentElement.classList.add('is-dirty');
      projectName.focus();
    };

    for (let e = 0; e < editButtons.length; e++) {
      editButtons[e].addEventListener('click', onEditClick)
    }
  }

  initDeleteProject () {

    let deleteButtons = document.querySelectorAll('.project-delete');

    if (typeof window.DialogFinder === 'undefined')
      return;

    this.deleteElementDialog = document.getElementById('delete-project');
    this.deleteFormElement = this.deleteElementDialog.querySelector('form');
    this.deleteProjectDialog =
        window.DialogFinder.get(this.deleteElementDialog);

    this.deleteFormElement.addEventListener('submit', (evt) => {
      evt.preventDefault();

      this.onConfirmDelete();
    });

    let onDeleteClick = (evt) => {
      if (!this.deleteProjectDialog)
        return;

      let projectKey =
          this.deleteFormElement.querySelector('[name="project-key"]');

      projectKey.value = evt.currentTarget.dataset.projectKey;
      this.deleteProjectDialog.show(this.onConfirmDelete, this.onCancelDelete);
    };

    for (let d = 0; d < deleteButtons.length; d++) {
      deleteButtons[d].addEventListener('click', onDeleteClick)
    }
  }

  onCopySecret (evt) {

    let secretElement = document.getElementById(
        evt.currentTarget.getAttribute('for'));
    let range = document.createRange();

    range.selectNode(secretElement);
    window.getSelection().addRange(range);

    try {
      document.execCommand('copy');
      ToasterInstance().then ( (toaster) => {
        toaster.toast("Secret copied to clipboard");
      });
    } catch (err) {
      ToasterInstance().then ( (toaster) => {
        toaster.toast("Unable to copy secret to clipboard");
      });
    } finally {
      window.getSelection().removeAllRanges();
    }
  }

  onConfirmCreate () {

    if (this.createFormElement.querySelector('[name="project-name"]')
        .value.trim() === '')
      return;

    if (!this.createFormElement.checkValidity())
      return;

    this.createProjectDialog.pending();
    this.postMessage(this.createFormElement,
        this.createFormElement.getAttribute('action'));
  }

  onCancelCreate () {
    this.createProjectDialog.hide();
  }

  onConfirmDelete () {
    this.deleteProjectDialog.pending();
    this.postMessage(this.deleteFormElement,
        this.deleteFormElement.getAttribute('action'));
  }

  onCancelDelete () {
    this.deleteProjectDialog.hide();
  }

  onConfirmEdit () {
    this.editProjectDialog.pending();
    this.postMessage(this.editFormElement,
        this.editFormElement.getAttribute('action'));
  }

  onCancelEdit () {
    this.editProjectDialog.hide();
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

new ProjectHandler();
