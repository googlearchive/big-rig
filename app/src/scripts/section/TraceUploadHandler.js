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

export default class TraceUploadHandler {

  constructor () {

    var addTraceFAB = document.getElementById('add-trace-button');

    if (!addTraceFAB)
      return;

    this.onConfirmUpload = this.onConfirmUpload.bind(this);
    this.onCancelUpload = this.onCancelUpload.bind(this);

    if (typeof window.DialogFinder === 'undefined')
      return;

    this.uploadElement = document.getElementById('add-trace-action');
    this.uploadFormElement = this.uploadElement.querySelector('form');
    this.uploadActionDialog =
        window.DialogFinder.get(this.uploadElement);

    if (!this.uploadActionDialog)
      return;

    this.uploadFormElement.addEventListener('submit', (evt) => {
      evt.preventDefault();

      this.onConfirmUpload();
    });

    addTraceFAB.addEventListener('click', () => {
      this.uploadActionDialog.show(this.onConfirmUpload, this.onCancelUpload);
    });

  }

  onConfirmUpload () {

    if (document.getElementById('trace-file').value.trim() === '')
      return;

    this.uploadActionDialog.pending();
    this.postMessage(this.uploadFormElement,
        this.uploadFormElement.getAttribute('action'));
  }

  onCancelUpload () {
    this.uploadActionDialog.hide();
  }

  postMessage (formElement, url) {
    let xhr = new XMLHttpRequest();
    let formData = new FormData(formElement);
    let secret = formElement.querySelector('#project-secret').value;
    let labels = []

    if (formElement.querySelector('#action-label'))
      labels.push(formElement.querySelector('#action-label').value);

    let data = {
      "secret": secret,
      "labels": labels
    }

    formData.append('data', JSON.stringify(data))

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        if (xhr.response.status == 'ok') {
          this.uploadActionDialog.complete();
          setTimeout( () => window.location = '', 4000 );
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

new TraceUploadHandler();
