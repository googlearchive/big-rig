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

export default class Dialog {
  constructor (element) {

    this.element = element;
    this.dialogBox = this.element.querySelector('.dialog__box');
    this.cancelButton = this.element.querySelector('.cancel-button');
    this.confirmButton = this.element.querySelector('.confirm-button');

    this.onConfirm = null;
    this.onCancel = null;

    this.pendingConfirm = false;

    if (typeof window.DialogFinder === 'undefined')
      window.DialogFinder = new WeakMap();

    window.DialogFinder.set(this.element, this);

    this.onElementClick = this.onElementClick.bind(this);
    this.onDialogBoxClick = this.onDialogBoxClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  show (onConfirm, onCancel) {

    this.onConfirm = onConfirm;
    this.onCancel = onCancel;

    this.addEventListeners();
    this.element.classList.add('dialog--visible');
  }

  hide () {
    this.removeEventListeners();
    this.element.classList.remove('dialog--visible');
    this.element.classList.remove('dialog--pending-confirm');
  }

  pending () {
    this.pendingConfirm = true;
    this.element.classList.add('dialog--pending-confirm');
  }

  complete () {
    this.pendingConfirm = false;
    this.element.classList.remove('dialog--pending-confirm');
    this.element.classList.add('dialog--complete');
  }

  onKeyDown (evt) {
    if (evt.keyCode == 27)
      this.hide();
  }

  onElementClick () {

    if (this.pendingConfirm)
      return;

    this.hide();
  }

  onDialogBoxClick (evt) {
    evt.stopPropagation();
  }

  addEventListeners () {

    if (this.cancelButton && this.onCancel)
      this.cancelButton.addEventListener('click', this.onCancel);

    if (this.confirmButton && this.onConfirm)
      this.confirmButton.addEventListener('click', this.onConfirm);

    this.element.addEventListener('click', this.onElementClick);
    this.dialogBox.addEventListener('click', this.onDialogBoxClick);
    window.addEventListener('keydown', this.onKeyDown);
  }

  removeEventListeners () {

    if (this.cancelButton && this.onCancel)
      this.cancelButton.removeEventListener('click', this.onCancel);

    if (this.confirmButton && this.onConfirm)
      this.confirmButton.removeEventListener('click', this.onConfirm);

    this.element.removeEventListener('click', this.onElementClick);
    this.dialogBox.removeEventListener('click', this.onDialogBoxClick);
    window.removeEventListener('keydown', this.onKeyDown);
  }
}

var dialogs = document.querySelectorAll('.dialog');
for (var d = 0; d < dialogs.length; d++) {
  new Dialog(dialogs[d]);
}
