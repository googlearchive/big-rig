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

/**
 * Quintic ease-out from:
 * @see: https://github.com/sole/tween.js/blob/master/src/Tween.js
 * @license: MIT
 */
const Easing = function (k) {
  if ( k === 0 ) return 0;
  if ( k === 1 ) return 1;
  if ( ( k *= 2 ) < 1 ) return 0.5 * Math.pow( 1024, k - 1 );
  return 0.5 * ( - Math.pow( 2, - 10 * ( k - 1 ) ) + 2 );
};

export default class Chart {

  constructor (selector) {

    this.data = [];
    this.renderData = null;

    this.selectedIndex = 0;
    this.compareIndex = 0;
    this.labelMode = this.constants.LABEL_RAW;
    this.wptTestResultID = null;
    this.commitURL = null;

    this.screenX = 0;
    this.mouseX = -1;

    this.xAxis = 0;
    this.yAxis = 0;
    this.axes = null;
    this.canUseSpeedIndex = false;

    this.element = document.querySelector(selector);

    if (!this.element)
      return;

    this.elementChart = this.element.querySelector('.render');
    this.elementControls = this.element.querySelector('.controls');

    this.xAxisButton = this.element.querySelector('#x-axis');
    this.yAxisButton = this.element.querySelector('#y-axis');
    this.xAxisOptions = this.element.querySelector('[for="x-axis"]');
    this.yAxisOptions = this.element.querySelector('[for="y-axis"]');

    this.detailsTitle =
        this.element.querySelector('.render-details__title');
    this.detailsSubTitle =
        this.element.querySelector('.render-details__subtitle');
    this.detailsFPS =
        this.element.querySelector('.render-details__fps');
    this.detailsSpeedIndex =
        this.element.querySelector('.render-details__speed-index');
    this.detailsDuration =
        this.element.querySelector('.render-details__duration');
    this.detailsParseHTML =
        this.element.querySelector('.render-details__parse-html');
    this.detailsJavaScript =
        this.element.querySelector('.render-details__javascript');
    this.detailsStyles =
        this.element.querySelector('.render-details__styles');
    this.detailsLayout =
        this.element.querySelector('.render-details__layout');
    this.detailsPaint =
        this.element.querySelector('.render-details__paint');
    this.detailsComposite =
        this.element.querySelector('.render-details__composite');

    this.wptDetailsButton = this.element.querySelector('.wpt-results-button');
    this.commitButton = this.element.querySelector('.commit-button');
    this.deleteButton = this.element.querySelector('.action-detail-delete');

    this.canvas = document.createElement('canvas');
    this.elementChart.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.animate = {
      from: Date.now(),
      until: Date.now()
    };

    this.draw = this.draw.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onXAxisOptionClick = this.onXAxisOptionClick.bind(this);
    this.onYAxisOptionClick = this.onYAxisOptionClick.bind(this);
    this.waitForDimensions = this.waitForDimensions.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onWPTButtonClick = this.onWPTButtonClick.bind(this);
    this.onCommitButtonClick = this.onCommitButtonClick.bind(this);

    if (typeof Intl !== 'undefined') {
      this.intlNumber = new Intl.NumberFormat();
      this.intlDateTime = new Intl.DateTimeFormat([], {
        month: 'short', day: 'numeric'
      });
    } else {
      this.intlNumber = this.intlDateTime = {
        format: function (x) {
          return x;
        }
      }
    }

    this.enableOptionSwitching();
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mousedown', this.onMouseDown);
    this.wptDetailsButton.addEventListener('click', this.onWPTButtonClick);
    this.commitButton.addEventListener('click', this.onCommitButtonClick);

    window.addEventListener('resize', () => {
      this.onResize();
      requestAnimationFrame(this.draw);
    });

    Promise.all([
      this.waitForDimensions(),
      this.loadData(this.element.dataset.url)
    ]).then(() => {
      requestAnimationFrame(this.draw);
    });
  }

  get constants () {
    return {
      PADDING_X: 48,
      PADDING_Y: 48,
      LABEL_PADDING_X: 60,
      LABEL_PADDING_Y: 20,
      AXIS_PADDING_X: 8,
      AXIS_PADDING_Y: 8,
      LABEL_MINIMUM_Y: 60,
      ANIMATION_DURATION: 800,
      ANIMATION_DELAY: 300,
      X_AXIS_VALUES: ['Evenly distributed', 'Temporally distributed'],
      Y_AXIS_VALUES: ['Relative values', 'Absolute values'],
      LABEL_RAW: 0,
      LABEL_COMPARISON: 1
    }
  }

  setWPTTestResultID () {

    this.wptTestResultID = null;
    let currentDataset = this.data.details[this.selectedIndex];

    if (typeof currentDataset.extendedInfo == 'undefined')
      return;

    let extendedInfo = currentDataset.extendedInfo;

    for (var x = 0; x < extendedInfo.length; x++) {
      if (extendedInfo[x].type === 'webpagetest-id') {
        this.wptTestResultID = extendedInfo[x].value;
        return;
      }
    }
  }

  setCommitURL () {

    this.commitURL = null;
    let currentDataset = this.data.details[this.selectedIndex];

    if (typeof currentDataset.extendedInfo == 'undefined')
      return;

    let extendedInfo = currentDataset.extendedInfo;

    for (var x = 0; x < extendedInfo.length; x++) {
      if (extendedInfo[x].type === 'commit') {
        this.commitURL = extendedInfo[x].value;
        return;
      }
    }

  }

  onCommitButtonClick () {

    if (this.commitURL === null)
      return;

    window.open(this.commitURL);
  }

  onWPTButtonClick () {

    if (this.wptTestResultID === null)
      return;

    window.open(`https://webpagetest.org/result/${this.wptTestResultID}/`,
        this.wptTestResultID);
  }

  onMouseDown (evt) {

    if (evt.target !== this.canvas)
      return;

    if (this.mouseX == -1)
      return;

    if (this.compareIndex === this.selectedIndex)
      return;

    this.selectedIndex = this.compareIndex;
    this.setWPTTestResultID();
    this.setCommitURL();

    // Update the delete button.
    this.deleteButton.dataset.actionDetailKey =
        this.data.details[this.selectedIndex].id;

    let now = Date.now();
    if (now > this.animate.until)
      requestAnimationFrame(this.draw);
  }

  onMouseMove (evt) {

    if (evt.target !== this.canvas) {
      this.mouseX = -1;
      return;
    }

    // Set up a draw unless we're already animating.
    let now = Date.now();
    if (now > this.animate.until)
      requestAnimationFrame(this.draw);

    this.mouseX = evt.pageX -
        this.screenX -
        this.constants.PADDING_X -
        this.constants.LABEL_PADDING_X -
        this.constants.AXIS_PADDING_X;

    this.mouseX = Math.max(0, this.mouseX);
  }

  enableOptionSwitching () {
    let xAxisOptionList = this.xAxisOptions.querySelectorAll('.mdl-menu__item');
    let yAxisOptionList = this.yAxisOptions.querySelectorAll('.mdl-menu__item');

    for (let x = 0; x < xAxisOptionList.length; x++) {
      xAxisOptionList[x].addEventListener('click', this.onXAxisOptionClick);
    }

    for (let y = 0; y < yAxisOptionList.length; y++) {
      yAxisOptionList[y].addEventListener('click', this.onYAxisOptionClick);
    }
  }

  onXAxisOptionClick (evt) {
    this.xAxisButton.disabled = true;
    this.yAxisButton.disabled = true;

    this.xAxis = parseInt(evt.currentTarget.dataset.value);
    this.postMessage('action-x-axis', this.xAxis, '/action/render-option');
    this.calculateAxes();
    this.updateAxisLabels();
  }

  onYAxisOptionClick (evt) {

    this.xAxisButton.disabled = true;
    this.yAxisButton.disabled = true;

    this.yAxis = parseInt(evt.currentTarget.dataset.value);
    this.postMessage('action-y-axis', this.yAxis, '/action/render-option');
    this.calculateAxes();
    this.updateAxisLabels();
  }

  postMessage (name, value, url) {
    let xhr = new XMLHttpRequest();
    let formData = new FormData();
    formData.append('project-key', this.data.projectKey);
    formData.append('action-key', this.data.actionKey);
    formData.append(name, value);

    xhr.addEventListener('load', () => {

      this.xAxisButton.disabled = false;
      this.yAxisButton.disabled = false;

      if (xhr.status === 200) {
        if (xhr.response.status == 'ok') {
          this.animate.from = Date.now() + 350;
          this.animate.until = this.animate.from +
              this.constants.ANIMATION_DURATION +
              this.constants.ANIMATION_DELAY;
          this.draw();
        } else {
          ToasterInstance().then ( (toaster) => {
            toaster.toast(`Failed to perform action: ${xhr.response.status}`);
          });
        }
      } else {
        // TODO(paullewis) Do a better warning.
        ToasterInstance().then ( (toaster) => {
          toaster.toast(`Failed to perform action`);
        });
      }
    });
    xhr.responseType = 'json';
    xhr.open('post', url);
    xhr.send(formData);
  }

  updateAxisLabels () {
    this.xAxisButton.querySelector('.current-value').textContent =
      this.constants.X_AXIS_VALUES[this.xAxis];

    this.yAxisButton.querySelector('.current-value').textContent =
      this.constants.Y_AXIS_VALUES[this.yAxis];
  }

  loadData (url) {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {

          this.animate.from = Date.now() + 350;
          this.animate.until = this.animate.from +
              this.constants.ANIMATION_DURATION +
              this.constants.ANIMATION_DELAY;

          this.data = xhr.response;
          this.data.details.sort(function(a, b) {
            return a.time - b.time
          });

          if (this.data.details.length === 1) {
            let firstEntry = JSON.parse(
                JSON.stringify(this.data.details[0]));
            this.data.details.push(firstEntry);
          }

          this.selectedIndex = this.data.details.length - 1;

          this.setWPTTestResultID();
          this.setCommitURL();

          this.xAxisButton.disabled = this.yAxisButton.disabled = false;
          this.xAxis = this.data.xAxis;
          this.yAxis = this.data.yAxis;

          this.remapDataForRender();
          this.calculateAxes();
          this.updateAxisLabels();

          resolve();
        } else {
          reject();
        }
      });
      xhr.responseType = 'json';
      xhr.open('get', url);
      xhr.send();
    })
  }

  waitForDimensions () {

    /*eslint-disable*/
    return new Promise((resolve, reject) => {
      this.width = this.canvas.parentElement.offsetWidth;
      this.height = this.canvas.parentElement.offsetHeight;

      if (this.width === 0 || this.height === 0) {
        requestAnimationFrame(this.waitForDimensions);
        return;
      }

      this.onResize();
      resolve();
    });
    /*eslint-enable*/
  }

  onResize () {

    let dPR = window.devicePixelRatio || 1;

    // Switch off the canvas.
    this.canvas.style.display = 'none';

    // Find out how large the parent element is.
    this.width = this.canvas.parentElement.offsetWidth;
    this.height = this.canvas.parentElement.offsetHeight;

    // Switch it back on.
    this.canvas.style.display = 'block';

    // Scale the backing store by the dPR.
    this.canvas.width = this.width * dPR;
    this.canvas.height = this.height * dPR;

    // Scale it back down to the width and height we want in logical pixels.
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';

    // Account for any upscaling by applying a single scale transform.
    this.ctx.scale(dPR, dPR);

    // Find out where the canvas is on screen.
    this.screenX = this.canvas.getBoundingClientRect().left;

  }

  setCanUseSpeedIndex () {
    this.canUseSpeedIndex =
      this.data.type === 'Load' &&
      this.data.details.every((currentValue) => {
        return (
          typeof currentValue.speedIndex !== 'undefined' &&
          parseInt(currentValue.speedIndex) > -1
        );
      });
  }

  calculateAxes () {

    this.setCanUseSpeedIndex();

    this.axes = this.data.details.reduce((lastValue, currentValue) => {

      lastValue.minX = Math.min(lastValue.minX, currentValue.time);
      lastValue.maxX = Math.max(lastValue.maxX, currentValue.time);

      let valueForYAxisUpper = 0;

      // Absolute values
      if (this.yAxis === 1) {

        // Set the maximum to be the sum of the work.
        valueForYAxisUpper = currentValue.parseHTML +
          currentValue.javaScript +
          currentValue.styles +
          currentValue.layout +
          currentValue.paint +
          currentValue.composite;

      } else {

        // Relative values
        switch (this.data.type) {

          case 'Load':
            if (this.canUseSpeedIndex && this.yAxis === 0)
              valueForYAxisUpper = currentValue.speedIndex;
            else
              valueForYAxisUpper = currentValue.duration;
            break;

          case 'Response':
            valueForYAxisUpper = currentValue.duration;
            break;

          case 'Animation':
            valueForYAxisUpper = currentValue.fps;
            break;

        }
      }

      let nearestGoodUnit = function (v) {

        // Figure out the nearest power of 10.
        let units = Math.floor(Math.log10(v)) - 1;
        units = Math.max(1, units);
        let unitsInPowersOfTen = Math.pow(10, units);

        return Math.ceil(v / unitsInPowersOfTen) *
            unitsInPowersOfTen;
      }

      lastValue.maxYUpper = Math.max(lastValue.maxYUpper,
          nearestGoodUnit(valueForYAxisUpper));

      lastValue.maxYLower = Math.max(lastValue.maxYLower,
          nearestGoodUnit(currentValue.raster || 0));

      return lastValue;

    }, {
      minX: Number.MAX_VALUE,
      minYUpper: 0,
      minYLower: 0,
      maxX: 0,
      maxYUpper: 0,
      maxYLower: 0,
      rangeX: 0,
      rangeY: 0
    });

    this.axes.rangeX = this.axes.maxX - this.axes.minX;
    this.axes.rangeYUpper = this.axes.maxYUpper - this.axes.minYUpper;
    this.axes.rangeYLower = this.axes.maxYLower - this.axes.minYLower;
  }

  remapDataForRender () {

    this.renderData = {
      parseHTML: {
        color: '#00B9D8',
        values: []
      },
      javaScript: {
        color: '#F0C457',
        values: []
      },
      styles: {
        color: '#9B7FE6',
        values: []
      },
      layout: {
        color: '#7761B3',
        values: []
      },
      paint: {
        color: '#74B266',
        values: []
      },
      raster: {
        color: '#74B266',
        values: []
      },
      composite: {
        color: '#519242',
        values: []
      },

      base: [],
      totals: []
    };

    this.data.details.forEach((entry) => {

      // If we are using relative values group paint with raster.
      if (this.yAxis === 0 && entry.raster)
        entry.paint += entry.raster;

      this.renderData.parseHTML.values.push(entry.parseHTML);
      this.renderData.javaScript.values.push(entry.javaScript);
      this.renderData.styles.values.push(entry.styles);
      this.renderData.layout.values.push(entry.layout);
      this.renderData.paint.values.push(entry.paint);
      this.renderData.raster.values.push(entry.raster || 0);
      this.renderData.composite.values.push(entry.composite);
      this.renderData.base.push(0);
      this.renderData.totals.push(entry.parseHTML +
          entry.javaScript +
          entry.styles +
          entry.layout +
          entry.paint +
          entry.composite);
    });
  }

  resetBaseYValues () {
    for (let b = 0; b < this.renderData.base.length; b++)
      this.renderData.base[b] = 0;
  }

  draw () {

    let clamp = function(min, max, value) {
      return Math.min(max, Math.max(min, value));
    }

    let now = Date.now();
    let nowRelative = now - this.animate.from;
    if (now <= this.animate.until)
      requestAnimationFrame(this.draw);

    this.ctx.clearRect(0, 0, this.width, this.height);

    if (!this.data)
      return;

    if (!this.data.details)
      return;

    if (this.data.details.length === 0)
      return;

    let drawWidth = this.width - this.constants.PADDING_X * 2 -
        (this.width * 0.3);
    let drawHeight = this.height - this.constants.PADDING_Y * 2;

    let chartOuterWidth = drawWidth - this.constants.LABEL_PADDING_X;
    let chartOuterHeight = drawHeight - this.constants.LABEL_PADDING_Y;

    // If we can use the Speed Index, add a second label to the right hand side.
    if (this.canUseSpeedIndex && this.yAxis === 1)
      chartOuterWidth -= this.constants.LABEL_PADDING_X;

    let chartWidth = chartOuterWidth - this.constants.AXIS_PADDING_X * 2;
    let chartHeight = chartOuterHeight - this.constants.AXIS_PADDING_Y * 2;

    // If the values are relative then don't split on raster...
    let chartHeightUpper = chartHeight;
    let chartHeightLower = 0;

    // Otherwise do.
    if (this.yAxis === 1) {
      let halfPadding = this.constants.PADDING_Y * 0.5;
      chartHeightUpper = Math.ceil(chartOuterHeight * (2/3)) - halfPadding -
          this.constants.AXIS_PADDING_Y * 2;
      chartHeightLower = Math.ceil(chartOuterHeight * (1/3)) - halfPadding -
          this.constants.AXIS_PADDING_Y * 2;
    }

    let selectedMarkerX = 0;
    let compareMarkerX = 0;
    let lastSelectedIndex = this.selectedIndex;
    let lastCompareIndex = this.compareIndex;

    // Total Area
    this.ctx.save();
    this.ctx.translate(
        this.constants.PADDING_X,
        this.constants.PADDING_Y);

    // Labels - Y
    {
      // Upper labels
      {
        let labelHeightUpper = chartHeightUpper;
        let numberOfLabelsY = Math.ceil(labelHeightUpper /
            this.constants.LABEL_MINIMUM_Y);
        let stepY = this.axes.rangeYUpper / numberOfLabelsY;

        this.ctx.font = '11px Roboto';
        this.ctx.fillStyle = '#A8A8A8';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';

        for (let l = 0; l <= numberOfLabelsY; l++) {
          let labelSuffix = 'ms';

          if (this.data.type === 'Load' && this.yAxis === 0)
            labelSuffix = '';

          if (this.data.type === 'Animation' && this.yAxis === 0)
            labelSuffix = 'fps';

          let label =
              this.intlNumber.format(
                  Math.round(this.axes.rangeYUpper - l * stepY)) +
              labelSuffix;
          let x = this.constants.LABEL_PADDING_X -
              this.constants.AXIS_PADDING_X;
          let y = this.constants.AXIS_PADDING_Y +
              (l / numberOfLabelsY * labelHeightUpper);
          this.ctx.fillText(label, x, y);
        }
      }

      // If the Y axis is absolute values, do lower labels too
      if (this.yAxis === 1) {

        let numberOfLabelsY = Math.ceil(chartHeightLower /
            this.constants.LABEL_MINIMUM_Y);
        let stepY = this.axes.rangeYLower / numberOfLabelsY;

        this.ctx.font = '11px Roboto';
        this.ctx.fillStyle = '#A8A8A8';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';

        this.ctx.save();
        this.ctx.translate(0, chartHeightUpper +
            this.constants.AXIS_PADDING_Y * 2 +
            this.constants.PADDING_Y);

        for (let l = 0; l <= numberOfLabelsY; l++) {
          let labelSuffix = 'ms';
          let label =
              this.intlNumber.format(
                  Math.round(this.axes.rangeYLower - l * stepY)
              ) + labelSuffix;
          let x = this.constants.LABEL_PADDING_X -
              this.constants.AXIS_PADDING_X;
          let y = this.constants.AXIS_PADDING_Y +

              // And add this label's offset.
              (l / numberOfLabelsY * chartHeightLower);
          this.ctx.fillText(label, x, y);
        }

        this.ctx.restore();
      }
    }

    this.ctx.translate(this.constants.LABEL_PADDING_X, 0);

    // Labels - X
    {
      let labelWidth = chartOuterWidth - this.constants.AXIS_PADDING_X * 2;
      let lastLabelX = Number.NEGATIVE_INFINITY;

      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'top';

      let shortestDistanceToLabelInX = Number.MAX_VALUE;
      this.data.details.forEach((entry, index) => {

        let label = this.intlDateTime.format(new Date(entry.time));
        let x = 0;

        // Evenly distributed
        if (this.xAxis === 0) {
          x = this.constants.AXIS_PADDING_X +
              (index / (this.data.details.length - 1)) * labelWidth;
        } else {
          x = this.constants.AXIS_PADDING_X +
              ((entry.time - this.axes.minX) / this.axes.rangeX) * labelWidth;
        }

        let y = chartOuterHeight + this.constants.AXIS_PADDING_Y;
        let width = this.ctx.measureText(label).width;

        // Set the marker's x position based on the label
        if (this.selectedIndex === index) {
          selectedMarkerX = x;
          y += 10;
          this.ctx.fillStyle = '#222';
          this.ctx.font = 'bold 13px Roboto';
        }

        let distanceToLabelInX = Math.abs(this.mouseX - x);
        if (this.mouseX !== -1 &&
            distanceToLabelInX < shortestDistanceToLabelInX) {
          shortestDistanceToLabelInX = distanceToLabelInX;
          compareMarkerX = x;
          this.compareIndex = index;
        }

        // Skip this label if there's insufficient space.
        if (x - lastLabelX < width)
          return;

        this.ctx.font = '11px Roboto';
        this.ctx.fillStyle = '#A8A8A8';
        this.ctx.fillText(label, x, y);

        lastLabelX = x;

      })
    }


    // Axes
    this.ctx.save();
    {
      // Relative
      if (this.yAxis === 0) {

        this.ctx.translate(0.5, 0.5);
        this.ctx.strokeStyle = '#DBDBDB';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, chartOuterHeight);
        this.ctx.lineTo(chartOuterWidth, chartOuterHeight);
        this.ctx.stroke();
        this.ctx.closePath();

      // Absolute
      } else {

        let axisHeightUpper = chartHeightUpper +
            this.constants.AXIS_PADDING_Y * 2;
        let axisHeightLower = chartHeightLower +
            this.constants.AXIS_PADDING_Y * 2;

        let axisLowerTop = axisHeightUpper +
            this.constants.PADDING_Y;
        let axisLowerBottom = axisLowerTop + axisHeightLower;

        this.ctx.translate(0.5, 0.5);

        // Upper chart
        this.ctx.strokeStyle = '#DBDBDB';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, axisHeightUpper);
        this.ctx.lineTo(chartOuterWidth, axisHeightUpper);
        this.ctx.stroke();
        this.ctx.closePath();

        // Lower chart
        this.ctx.strokeStyle = '#DBDBDB';
        this.ctx.beginPath();
        this.ctx.moveTo(0, axisLowerTop);
        this.ctx.lineTo(0, axisLowerBottom);
        this.ctx.lineTo(chartOuterWidth, axisLowerBottom);
        this.ctx.stroke();
        this.ctx.closePath();
      }
    }
    this.ctx.restore();

    this.ctx.save();
    {
      // Chart data.
      this.ctx.translate(
          this.constants.AXIS_PADDING_X,
          this.constants.AXIS_PADDING_Y);

      this.ctx.save();
      {
        this.ctx.beginPath();
        this.ctx.rect(0, 0, chartWidth, chartHeight);
        this.ctx.clip();
        this.ctx.closePath();

        {
          let renderOrder = [
              'parseHTML',
              'javaScript',
              'styles',
              'layout',
              'paint',
              'composite',
              'raster'];

          this.ctx.globalCompositeOperation = 'destination-over';

          // Reset the base value for this run.
          this.resetBaseYValues();

          renderOrder.forEach( (renderKey) => {

            let renderBlock = this.renderData[renderKey];
            let isRaster = (renderKey === 'raster');
            let chartBottom = isRaster ? (
                  chartHeightUpper + chartHeightLower +
                  this.constants.AXIS_PADDING_Y +
                  this.constants.PADDING_Y +
                  this.constants.AXIS_PADDING_Y
                ) : chartHeightUpper;

            this.ctx.beginPath();
            this.ctx.moveTo(0, chartBottom);
            this.ctx.fillStyle = renderBlock.color;

            renderBlock.values.forEach((value, index) => {

              let delay = (index / renderBlock.values.length) *
                  this.constants.ANIMATION_DELAY;
              let baseY = this.renderData.base[index];
              let blockY = this.data.details[index].duration;
              let overallBlockWorkTotal = this.renderData.totals[index];

              if (this.canUseSpeedIndex && this.yAxis === 0)
                blockY = this.data.details[index].speedIndex;

              if (this.data.type === 'Animation')
                blockY = this.data.details[index].fps;

              let overallBlockHeight = 0;

              if (isRaster) {
                blockY = this.axes.maxYLower;
                let rasterTime = (this.data.details[index].raster || 0);
                overallBlockHeight = (rasterTime / this.axes.maxYLower) *
                    chartHeightLower;
              } else {
                overallBlockHeight = (blockY / this.axes.maxYUpper) *
                    chartHeightUpper;
              }

              let x = 0;
              let y = 0;

              // Relative values
              if (this.xAxis === 0) {
                x = (index / (this.renderData.totals.length - 1)) * chartWidth;
              } else {
                // Absolute values
                x = (
                      (this.data.details[index].time - this.axes.minX) /
                      this.axes.rangeX
                    ) * chartWidth;
              }

              // Relative values
              if (this.yAxis === 0) {
                let relativeTaskHeight = value / overallBlockWorkTotal;
                y = baseY + relativeTaskHeight * overallBlockHeight;
              } else {
                // Absolute values
                let absoluteTaskHeight = value / blockY;
                y = absoluteTaskHeight * overallBlockHeight;

                if (!isRaster)
                  y += baseY;
              }

              // Now remap to eased values.
              let blockTime = (nowRelative - delay) /
                  this.constants.ANIMATION_DURATION;
              let yAdjustment = clamp(0, 1, blockTime);
              y *= Easing(yAdjustment);

              if (!isRaster)
                this.renderData.base[index] = y;

              this.ctx.lineTo(x, chartBottom - y)
            });

            this.ctx.lineTo(chartWidth, chartBottom);
            this.ctx.closePath();
            this.ctx.fill();
          });
        }

        // RAIL markers
        let threshold = 0;
        switch (this.data.type) {
          case 'Animation':

            if (this.yAxis === 0)
              threshold = 60;
            else
              threshold = 16.666;

            break;
          case 'Response':
            threshold = 100;
            break;
          case 'Load':
            threshold = 1000;
            break;
        }

        let thresholdY = Math.round((threshold / this.axes.maxYUpper) *
            chartHeightUpper);

        this.ctx.save();
        {
          this.ctx.globalCompositeOperation = 'source-over';
          this.ctx.strokeStyle = 'rgba(0,0,0,0.54)';
          this.ctx.setLineDash([4,2]);
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.moveTo(-this.constants.AXIS_PADDING_X,
              chartHeightUpper - thresholdY);
          this.ctx.lineTo(chartWidth + this.constants.AXIS_PADDING_X,
              chartHeightUpper - thresholdY);
          this.ctx.stroke();
          this.ctx.closePath();
        }
        this.ctx.restore();
      }
      this.ctx.restore();
    }
    this.ctx.restore();

    // Comparison Marker
    this.ctx.save();
    if (this.mouseX !== -1 && compareMarkerX !== selectedMarkerX) {

      let compareMarkerHeight = chartOuterHeight + 2;
      compareMarkerX = Math.round(compareMarkerX);

      // Line
      this.ctx.strokeStyle = 'rgba(0,0,0,0.36)';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(compareMarkerX, 0);
      this.ctx.lineTo(compareMarkerX, compareMarkerHeight);
      this.ctx.stroke();
      this.ctx.closePath();

      // Bottom Triangle
      this.ctx.fillStyle = 'rgba(0,0,0,0.36)';
      this.ctx.beginPath();
      this.ctx.moveTo(compareMarkerX, compareMarkerHeight - 1);
      this.ctx.lineTo(compareMarkerX + 3, compareMarkerHeight + 5);
      this.ctx.lineTo(compareMarkerX - 3, compareMarkerHeight + 5);
      this.ctx.lineTo(compareMarkerX, compareMarkerHeight - 1);
      this.ctx.closePath();
      this.ctx.fill();

      // Top Triangle
      this.ctx.fillStyle = 'rgba(0,0,0,0.36)';
      this.ctx.beginPath();
      this.ctx.moveTo(compareMarkerX, 1);
      this.ctx.lineTo(compareMarkerX + 3, -5);
      this.ctx.lineTo(compareMarkerX - 3, -5);
      this.ctx.lineTo(compareMarkerX, 1);
      this.ctx.closePath();
      this.ctx.fill();
    }
    this.ctx.restore();

    // Selection Marker
    this.ctx.save();
    {

      let selectionMarkerHeight = chartOuterHeight +
          this.constants.AXIS_PADDING_Y * 0.5;
      selectedMarkerX = Math.round(selectedMarkerX);

      // Line
      this.ctx.strokeStyle = '#EF3C79';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(selectedMarkerX, 0);
      this.ctx.lineTo(selectedMarkerX, selectionMarkerHeight);
      this.ctx.stroke();
      this.ctx.closePath();

      // Bottom Triangle
      this.ctx.fillStyle = '#EF3C79';
      this.ctx.beginPath();
      this.ctx.moveTo(selectedMarkerX, selectionMarkerHeight - 2);
      this.ctx.lineTo(selectedMarkerX + 5, selectionMarkerHeight + 8);
      this.ctx.lineTo(selectedMarkerX - 5, selectionMarkerHeight + 8);
      this.ctx.lineTo(selectedMarkerX, selectionMarkerHeight - 2);
      this.ctx.closePath();
      this.ctx.fill();

      // Top Triangle
      this.ctx.fillStyle = '#EF3C79';
      this.ctx.beginPath();
      this.ctx.moveTo(selectedMarkerX, 2);
      this.ctx.lineTo(selectedMarkerX + 5, -8);
      this.ctx.lineTo(selectedMarkerX - 5, -8);
      this.ctx.lineTo(selectedMarkerX, 2);
      this.ctx.closePath();
      this.ctx.fill();
    }
    this.ctx.restore();

    // Chart labels
    this.ctx.save();
    {
      this.ctx.font = '500 11px Roboto';
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'bottom';
      this.ctx.fillStyle = '#686868';

      this.ctx.translate(-this.constants.LABEL_PADDING_X, -12);
      this.ctx.fillText('MAIN THREAD', 0, 0);

      if (this.yAxis === 1) {
        this.ctx.translate(0, chartHeightUpper +
           this.constants.AXIS_PADDING_Y * 2 +
           this.constants.PADDING_Y);
        this.ctx.fillText('RASTER THREADS', 0, 0);
      }
    }
    this.ctx.restore();

    // DOMContentLoaded
    this.ctx.save();
    {

      this.ctx.translate(
          this.constants.AXIS_PADDING_X,
          this.constants.AXIS_PADDING_Y);

      if (false && this.data.type === 'Load' && this.yAxis === 1) {

        let dataLen = this.data.details.length;
        for (var d = 0; d < dataLen - 1; d++) {

          let dclStart = this.data.details[d].domContentLoaded;
          let dclEnd = this.data.details[d+1].domContentLoaded;

          let xStart = 0;
          let xEnd = 0;

          let yStart = Math.round((dclStart / this.axes.maxYUpper) *
              chartHeightUpper);
          let yEnd = Math.round((dclEnd / this.axes.maxYUpper) *
              chartHeightUpper);

          // Relative values
          if (this.xAxis === 0) {
            xStart = (d / (dataLen - 1)) * chartWidth;
            xEnd = ((d+1) / (dataLen - 1)) * chartWidth;
          } else {
            // Absolute values
            xStart =
                (
                  (this.data.details[d].time - this.axes.minX) /
                  this.axes.rangeX
                ) * chartWidth;
            xEnd =
                (
                  (this.data.details[d+1].time - this.axes.minX) /
                  this.axes.rangeX
                ) * chartWidth;
          }

          this.ctx.strokeStyle = '#FF00FF';
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(xStart, chartHeightUpper - yStart);
          this.ctx.lineTo(xEnd, chartHeightUpper - yEnd);
          this.ctx.stroke();
          this.ctx.closePath();
        }
      }
    }
    this.ctx.restore();

    this.ctx.restore();

    if (this.mouseX == -1 || (this.selectedIndex == this.compareIndex))
      this.updateLabelsToRawValues();
    else if (lastCompareIndex !== this.compareIndex)
      this.updateLabelsToComparisonValues();

  }

  updateLabelsToComparisonValues () {

    this.labelMode = this.constants.LABEL_COMPARISON;
    this.removePositiveAndNegativeClasses();

    let data = this.data.details[this.selectedIndex];
    let comparisonData = this.data.details[this.compareIndex];

    let datetime = new Date(comparisonData.time);
    let suffix = datetime.getUTCHours() < 12 ? 'am' : 'pm';
    let minutes = datetime.getUTCMinutes();

    if (minutes < 10)
      minutes = `0${minutes}`;

    let time =
        `${datetime.getUTCHours() % 12}:${minutes} ${suffix}`;

    this.detailsTitle.textContent = this.intlDateTime.format(datetime);
    this.detailsSubTitle.textContent = time;

    // Group paint and raster together here.
    let comparisonPaint = comparisonData.paint + (comparisonData.raster || 0);
    let dataPaint = data.paint + (data.raster || 0);

    let speedIndex = comparisonData.speedIndex - data.speedIndex;
    let duration = comparisonData.duration - data.duration;
    let fps = comparisonData.fps - data.fps;
    let parseHTML = comparisonData.parseHTML - data.parseHTML;
    let javaScript = comparisonData.javaScript - data.javaScript;
    let styles = comparisonData.styles - data.styles;
    let layout = comparisonData.layout - data.layout;
    let paint = comparisonPaint - dataPaint;
    let composite = comparisonData.composite - data.composite;

    let isPositive = false;
    let prefix = '';
    let comparisonClass = '';

    if (this.detailsDuration) {

      isPositive = duration > 0;
      prefix = (isPositive || (duration == 0) ? '+' : '')
      comparisonClass = (isPositive ? 'positive' : 'negative');

      this.detailsDuration.textContent =
          prefix + this.intlNumber.format(duration) + 'ms';
      this.detailsDuration.classList.add(comparisonClass);
    }

    if (this.detailsSpeedIndex) {

      isPositive = speedIndex > 0;
      prefix = (isPositive || (speedIndex == 0) ? '+' : '');
      comparisonClass = (isPositive ? 'positive' : 'negative');

      this.detailsSpeedIndex.textContent =
          prefix + this.intlNumber.format(speedIndex);
      this.detailsSpeedIndex.classList.add(comparisonClass);
    }

    if (this.detailsFPS) {
      isPositive = fps > 0;
      prefix = (isPositive || (fps == 0) ? '+' : '');
      comparisonClass = (isPositive ? 'negative' : 'positive');

      this.detailsFPS.textContent =
          prefix + this.intlNumber.format(fps);
      this.detailsFPS.classList.add(comparisonClass);
    }

    isPositive = parseHTML > 0;
    prefix = (isPositive || (parseHTML == 0) ? '+' : '');
    comparisonClass = (isPositive ? 'positive' : 'negative');
    this.detailsParseHTML.textContent =
        prefix + this.intlNumber.format(parseHTML) + 'ms';
    this.detailsParseHTML.classList.add(comparisonClass);

    isPositive = javaScript > 0;
    prefix = (isPositive || (javaScript == 0) ? '+' : '');
    comparisonClass = (isPositive ? 'positive' : 'negative');
    this.detailsJavaScript.textContent =
        prefix + this.intlNumber.format(javaScript) + 'ms';
    this.detailsJavaScript.classList.add(comparisonClass);

    isPositive = styles > 0;
    prefix = (isPositive || (styles == 0) ? '+' : '');
    comparisonClass = (isPositive ? 'positive' : 'negative');
    this.detailsStyles.textContent =
        prefix + this.intlNumber.format(styles) + 'ms';
    this.detailsStyles.classList.add(comparisonClass);

    isPositive = layout > 0;
    prefix = (isPositive || (layout == 0) ? '+' : '');
    comparisonClass = (isPositive ? 'positive' : 'negative');
    this.detailsLayout.textContent =
        prefix + this.intlNumber.format(layout) + 'ms';
    this.detailsLayout.classList.add(comparisonClass);

    isPositive = paint > 0;
    prefix = (isPositive || (paint == 0) ? '+' : '')
    comparisonClass = (isPositive ? 'positive' : 'negative');
    this.detailsPaint.textContent =
        prefix + this.intlNumber.format(paint) + 'ms';
    this.detailsPaint.classList.add(comparisonClass);

    isPositive = composite > 0;
    prefix = (isPositive || (composite == 0) ? '+' : '')
    comparisonClass = (isPositive ? 'positive' : 'negative');
    this.detailsComposite.textContent =
        prefix + this.intlNumber.format(composite) + 'ms';
    this.detailsComposite.classList.add(comparisonClass);

  }

  updateLabelsToRawValues () {

    if (this.labelMode == this.constants.LABEL_RAW)
      return;

    this.labelMode = this.constants.LABEL_RAW;
    this.removePositiveAndNegativeClasses();

    let data = this.data.details[this.selectedIndex];
    let datetime = new Date(data.time);
    let suffix = datetime.getUTCHours() < 12 ? 'am' : 'pm';
    let minutes = datetime.getUTCMinutes();

    if (minutes < 10)
      minutes = `0${minutes}`;

    let time =
        `${datetime.getUTCHours() % 12}:${minutes} ${suffix}`;

    this.detailsTitle.textContent = this.intlDateTime.format(datetime);
    this.detailsSubTitle.textContent = time;

    if (this.detailsFPS)
      this.detailsFPS.textContent = data.fps;

    if (this.detailsDuration) {
      this.detailsDuration.textContent =
          this.intlNumber.format(data.duration) + 'ms';
    }

    if (this.detailsSpeedIndex) {
      this.detailsSpeedIndex.textContent =
          this.intlNumber.format(data.speedIndex);
    }

    let paintTime = data.paint;

    if (typeof data.raster !== 'undefined')
      paintTime += data.raster;

    this.detailsParseHTML.textContent =
        this.intlNumber.format(data.parseHTML) + 'ms';
    this.detailsJavaScript.textContent =
        this.intlNumber.format(data.javaScript) + 'ms';
    this.detailsStyles.textContent =
        this.intlNumber.format(data.styles) + 'ms';
    this.detailsLayout.textContent =
        this.intlNumber.format(data.layout) + 'ms';
    this.detailsPaint.textContent =
        this.intlNumber.format(paintTime) + 'ms';
    this.detailsComposite.textContent =
        this.intlNumber.format(data.composite) + 'ms';

    if (this.wptTestResultID)
      this.wptDetailsButton.classList.add('wpt-results-button--visible');
    else
      this.wptDetailsButton.classList.remove('wpt-results-button--visible');

    if (this.commitURL)
      this.commitButton.classList.add('commit-button--visible');
    else
      this.commitButton.classList.remove('commit-button--visible');
  }

  removePositiveAndNegativeClasses () {

    if (this.detailsDuration)
      this.detailsDuration.classList.remove('positive');
    if (this.detailsFPS)
      this.detailsFPS.classList.remove('positive');
    if (this.detailsSpeedIndex)
      this.detailsSpeedIndex.classList.remove('positive');

    this.detailsParseHTML.classList.remove('positive');
    this.detailsJavaScript.classList.remove('positive');
    this.detailsStyles.classList.remove('positive');
    this.detailsLayout.classList.remove('positive');
    this.detailsPaint.classList.remove('positive');
    this.detailsComposite.classList.remove('positive');

    if (this.detailsDuration)
      this.detailsDuration.classList.remove('negative');
    if (this.detailsFPS)
      this.detailsFPS.classList.remove('negative');
    if (this.detailsSpeedIndex)
      this.detailsSpeedIndex.classList.remove('negative');
    this.detailsParseHTML.classList.remove('negative');
    this.detailsJavaScript.classList.remove('negative');
    this.detailsStyles.classList.remove('negative');
    this.detailsLayout.classList.remove('negative');
    this.detailsPaint.classList.remove('negative');
    this.detailsComposite.classList.remove('negative');
  }
}
