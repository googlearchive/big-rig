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

# Getting started - Create an Action

An Action represents one of three things:

1.   **Load**. A Load Action represents a single page loading. Traces for this typically come from Chrome DevTools or WebPagetest.
2.   **Response**. A Response Action comes from a user's interaction, such as tapping to open a side menu, or toggling a checkbox.
3.   **Animation**. An Animation Action is a page scroll, transition, or some other movement timed to the refresh rate of the screen (typically 60Hz, giving 60fps).

In this example, we'll create a **Load Action**.

To create an Action:

1.  Go to your Project and **press the Add button** in the upper right corner.
    ![Create an Action - step 1](/images/help/create-action-1.png)

2.  **Enter the name of your Action**, and give it a label, e.g. home-page-load. The label will be used to disambiguate for which Action you're providing a trace when using the endpoint. In this instance we won't use it, so enter whatever you like.
    ![Create an Action - step 2](/images/help/create-project-2.png)

3.  **Click "Create Action"**. Your new Action appears in the list.
    ![Create an Action - step 3](/images/help/create-project-3.png)

**Next:** [Take a Trace with Chrome DevTools](take-a-trace-with-chrome-devtools.html)

**Previous:** [Create a Project](create-a-project.html)

