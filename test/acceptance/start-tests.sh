#!/bin/bash

# Run the acceptance tests
export HEADLESS=true
npm run ci-test
