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

export default class ActionDetailHandler {

  constructor () {

    this.onConfirmEditParent = this.onConfirmEditParent.bind(this);
    this.onCancelEditParent = this.onCancelEditParent.bind(this);
    this.onConfirmDeleteParent = this.onConfirmDeleteParent.bind(this);
    this.onCancelDeleteParent = this.onCancelDeleteParent.bind(this);
    this.onConfirmDelete = this.onConfirmDelete.bind(this);
    this.onCancelDelete = this.onCancelDelete.bind(this);

    // Edit Action
    this.initEditParentAction();

    // Delete Action Detail
    this.initDeleteActionDetail();

    // Delete Action (and all details)
    this.initDeleteParentAction();
  }

  initEditParentAction () {

    let actionSelector = document.getElementById('action-options-selector');
    let editAction = actionSelector.querySelector('[for="edit-action"]');

    if (typeof window.DialogFinder === 'undefined')
      return;

    this.editElement = document.getElementById('edit-action');
    this.editFormElement = this.editElement.querySelector('form');
    this.editActionDialog =
        window.DialogFinder.get(this.editElement);

    if (!this.editActionDialog)
      return;

    this.editFormElement.addEventListener('submit', (evt) => {
      evt.preventDefault();
      this.onConfirmEditParent();
    });

    editAction.addEventListener('click', () => {
      this.editActionDialog.show(this.onConfirmEditParent,
          this.onCancelEditParent);
    });
  }

  initDeleteParentAction () {

    let actionSelector = document.getElementById('action-options-selector');
    let deleteAction = actionSelector.querySelector('[for="delete-action"]');

    this.deleteParentElement = document.getElementById('delete-action');
    this.deleteParentFormElement = this.deleteParentElement.querySelector('form');
    this.deleteParentActionDialog =
        window.DialogFinder.get(this.deleteParentElement);

    if (!this.deleteParentActionDialog)
      return;

    deleteAction.addEventListener('click', () => {
      this.deleteParentActionDialog.show(this.onConfirmDeleteParent,
          this.onCancelDeleteParent);
    });
  }

  initDeleteActionDetail () {

    this.deleteActionElement = document.getElementById('delete-action-detail');
    this.deleteActionFormElement =
        this.deleteActionElement.querySelector('form');
    this.deleteActionDialog =
        window.DialogFinder.get(this.deleteActionElement);

    if (!this.deleteActionDialog)
      return;

    let deleteAction = document.querySelector('.action-detail-delete');

    if (!deleteAction)
      return;

    let onDeleteActionClick = (evt) => {

      let actionDetailKeyInput = this.deleteActionFormElement
          .querySelector('[name="action-detail-key"]');

      actionDetailKeyInput.value = evt.currentTarget.dataset.actionDetailKey;

      this.deleteActionDialog.show(this.onConfirmDelete,
          this.onCancelDelete);
    };

    deleteAction.addEventListener('click', onDeleteActionClick);
  }

  onConfirmEditParent () {

    if (document.getElementById('action-name').value.trim() === '')
      return;

    if (document.getElementById('action-label').value.trim() === '')
      return;

    if (!this.editFormElement.checkValidity())
      return;

    this.editActionDialog.pending();
    this.postMessage(this.editFormElement,
        this.editFormElement.getAttribute('action'));
  }

  onCancelEditParent () {
    this.editActionDialog.hide();
  }

  onConfirmDeleteParent () {
    this.deleteParentActionDialog.pending();
    this.postMessage(this.deleteParentFormElement,
        this.deleteParentFormElement.getAttribute('action'));
  }

  onCancelDeleteParent () {
    this.deleteParentActionDialog.hide();
  }

  onConfirmDelete () {
    this.deleteActionDialog.pending();
    this.postMessage(this.deleteActionFormElement,
        this.deleteActionFormElement.getAttribute('action'));
  }

  onCancelDelete () {
    this.deleteActionDialog.hide();
  }

  postMessage (formElement, url) {
    let xhr = new XMLHttpRequest();
    let formData = new FormData(formElement);

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        if (xhr.response.status == 'ok') {
          setTimeout( () => window.location = '', 1000 );
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

new ActionDetailHandler();
