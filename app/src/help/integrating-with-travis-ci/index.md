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

# Integrating with Travis CI

Travis CI will let you run a test on WebPagetest, and submit the results to Big Rig.

## Step 1: Set up a Project at least one Load Action

If you haven't already got a Project, you can learn how to [make one with the Getting Started guide](../getting-started/).

## Step 2: Add a Travis file.

The `.travis.yml` file needs to be added the root of your site's repo and should contain:

```
language: node_js
node_js:
- 0.12.5
install: npm install
sudo: false
```

If you don't want the Big Rig test to be considered test-breaking you should put `npm test` in the `after_success` section of your .travis.yml file:

```
after_success:
- npm test
```

## Step 3. Add bigrig.js to your repo.

When Travis runs it will call `npm test` which will, in turn, run `node bigrig.js`. You can download the `bigrig.js` file here:

<a href="/addons/bigrig.js" download>Get bigrig.js</a>

The assumption is that this will live in the root of your site, however you can move it if you prefer. If you do so you will need to update the path referenced in the package.json file.

## Step 4. Add a task list

`bigrig.js` will run through a set of URLs and set up a test on WebPagetest for each. You will need to create `config.js` file that lives in the same location as `bigrig.js` and looks like:

```javascript
module.exports = {
  "tasks": {
    "Home Page (Cable, Desktop)": {
      "url": "https://your-domain.com/",
      "labels": "home-page-cable-desktop"
    },

    "Home Page (3G, Motorola G)": {
      "url": "https://your-domain.com/",
      "labels": "home-page-3g-motorola-g",
      "location": "Dulles_MotoG:Motorola G - Chrome Dev",
      "connectivity": "3G"
    },
  }
}
```

<a href="/addons/config.js" download>Get config.js</a>

## Step 5: Update package.json.

Your site likely has a package.json file, and the following will need to be added.

```json
"devDependencies": {
  "request": "^2.60.0",
  "webpagetest": "^0.3.3"
},
"scripts": {
  "test": "node bigrig.js"
}
```

This will ensure that when Travis clones the repo and runs `npm install` that it will get all the correct dependencies.

## Step 6. Add environment variables

The `bigrig.js` script does not contain sensitive information, such as Big Rig's Project secrets, a WebPagetest API key, or the URL of your Big Rig instance. These will need to be added as encrypted environment variables that will Travis will decrypt and use when running the tests.

Firstly install the Travis helper:

```bash
gem install travis
```

Next call it for the three environment variables needed by the test:

```bash
travis encrypt RIG_URL=[BIG_RIG_URL] --add env.global
travis encrypt WPT_API_KEY=[INSERT_API_KEY] --add env.global
travis encrypt SECRET=[INSERT_PROJECT_SECRET] --add env.global
```

Note: the Big Rig URL should be in the format **your-rig.com** with no protocol, trailing slashes, paths or querystrings.

You can [request a WebPagetest API key from the WebPagetest site](http://www.webpagetest.org/getkey.php), and each Project's secret can be found on the [Project list](/projects/list) page.

## Step 7. Enable Travis testing

Finally, with all of the changes above committed into the repo, head over to [Travis](https://travis-ci.org/auth) and enable tests for your repo.

If the build succeeds then data will be posted to Big Rig for you to pick up.
