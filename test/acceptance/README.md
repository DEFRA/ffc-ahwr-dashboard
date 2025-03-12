# Acceptance Tests

> Future Farming and Countryside Programme - AHWR Dashboard Acceptance Tests

This folder contains the acceptance tests for the FFC AHWR Dashboard service components.

The framework is using (Cucumber)[https://cucumber.io/] and (webdriver.io)[https://webdriver.io/]

## Requirements

- Docker
- Node
- npm

## Test execution in CI build pipeline

When the tests are run by Jenkins the `TEST_ENVIRONMENT_ROOT_URL` variable is generated and exposed by the PR build pipeline to point to the PR-specific Sandbox deployment.

## Test execution locally

### Environment Variables

Provide the following environment variables, typically in a `.env` file in the `/test/acceptance` directory:

```pwsh
TEST_ENVIRONMENT_ROOT_URL
CRN_USERNAME
CRN_PASSWORD
```

### Running tests inside a container

Docker is used to create containers for both the tests (`wdio-cucumber`) and the Selenium instance of Chrome (`chrome-browser`). This is also how the tests run in the Jenkins pipeline. Headless browser mode is used.

1. For ARM architectures, change the image used for Chrome in `docker-compose.yaml`:

```dockerfile
  selenium:
    image: selenium/standalone-chrome

# CHANGES TO..

  selenium:
    image: seleniarm/standalone-chromium
```

Or pass the value for the env variable SELENIUM_IMAGE based on the machine architecture.

2. If running against `localhost` ensure the application container is running with `docker-compose up --build` from the root folder of the repository.

3. From the `/test/acceptance` directory run `docker-compose run --build --rm wdio-cucumber`. This will run all acceptance tests.

### Running tests outside a container

To run tests outside a container, with the browser interaction visible:

1. Run `npm run test`, this will run all tests by executing the following script defined in `package.json`:

```pwsh
npx wdio ./wdio.conf.js --cucumberOpts.tags='@ci-run'
```

2. Run a specific test or tests with a tag:

```pwsh
npx wdio run ./wdio.conf.js --cucumberOpts.tags=@tag
```

## Running tests in parallel

Tests can be run in parallel at feature file level by increasing the number of instances available to WebdriverIO in `wdio.conf.js`, e.g.:

```js
maxInstances: 3,
```

## Running tests against multiple browsers

Tests can be run against multiple browsers by specifying additional capabilities together with more instances in `wdio.conf.js`:

```js
maxInstances: 10,
capabilities: [
    { acceptInsecureCerts: true, browserName: 'chrome' },
    { acceptInsecureCerts: true, browserName: 'firefox' },
    { acceptInsecureCerts: true, browserName: 'edge' }
],
```
