<!--

Copyright 2015 Google Inc. All rights reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

-->

# Getting started - Take a Trace with Chrome DevTools

Chrome DevTools' Timeline will allow you to export a trace file which you can then import into Big Rig.

To get a trace file:

1.  **Open a site and then open Chrome DevTools** (View > Developer > Developer Tools). **Please note**: you must _only have one tab open_ in Chrome / Canary when taking the recording. If not Big Rig will fail to identify the correct tab to analyze.
    ![Take a trace - step 1](/images/help/take-trace-1.png)

2.  Go to the Network tab and check **"Disable cache"**
    ![Take a trace - step 2](/images/help/take-trace-2.png)

3.  Go to the Timeline tab and hit **Cmd+R (Mac) or Ctrl+R (Windows / Linux)** to reload the page.
    ![Take a trace - step 3](/images/help/take-trace-3.png)

4.  Right-click on the timeline and choose **"Save Timeline Data..."**
    ![Take a trace - step 4](/images/help/take-trace-4.png)

5.  Save the file with the suffix **.json**.
    ![Take a trace - step 4](/images/help/take-trace-5.png)

**Next:** [Import the trace](import-the-trace.html)

**Previous:** [Create a Load Action](create-an-action.html)
