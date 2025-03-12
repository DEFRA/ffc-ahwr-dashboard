require("webdriverio/build/commands/browser/$");
const { expect } = require("chai");
require("constants");
const { AxeBuilder } = require("@axe-core/webdriverio");
require("dotenv").config({ path: `.env.${process.env.ENV}` });

const fs = require("fs");
const { remote } = require("webdriverio");
let url = "";
class CommonActions {
  async open(path) {
    try {
      url = process.env.TEST_ENVIRONMENT_ROOT_URL + path;
      await browser.url(url);
    } catch (error) {
      // Handle the "invalid session id" error by restarting the WebDriver session
      if (error.message.includes("invalid session id")) {
        console.log(
          "Invalid session ID encountered. Restarting the session...",
        );
        await browser.reloadSession(); // Assuming reloadSession is available in your setup
        await browser.url(url); // Retry the navigation
      } else {
        throw error; // Re-throw other errors
      }
    }
  }

  async clickOn(element) {
    const locator = browser.$(element);
    await locator.click();
  }

  async sendKey(element, text) {
    const locator = browser.$(element);
    await locator.setValue(text);
  }

  async elementToContainText(element, text) {
    const locator = await browser.$(element);
    expect(await locator.getText()).to.include(text);
  }

  async elementGetText(element) {
    const locator = await browser.$(element);
    let Text = await locator.getText();
    return Text;
  }

  async elementTextShouldBe(element, text) {
    const locator = await browser.$(element);
    expect(await locator.getText()).to.equal(text);
  }

  async elementValidateText(actual, expected) {
    expect(actual).to.equal(expected);
  }

  async getPageTitle(expectedTitle) {
    const actualTitle = await browser.getTitle();
    return actualTitle;
  }

  async switchToWindow() {
    const windowHandles = await browser.getWindowHandles();
    await browser.switchToWindow(windowHandles[1]);
  }

  async switchToOldWindow() {
    const windowHandles = await browser.getWindowHandles();
    await browser.closeWindow();
    await browser.switchToWindow(windowHandles[0]);
  }

  async urlContain(expectedUrl) {
    const actualUrl = await browser.getUrl();
    expect(actualUrl).to.include(expectedUrl);
  }

  async screenShot() {
    const sleep = (waitTimeInMs) =>
      new Promise((resolve) => setTimeout(resolve, waitTimeInMs));
    await sleep(5000);
    var date = Date.now();
    const screenshots = await browser.saveScreenshot(
      "./screenShots/chrome-" + date + ".png",
    );
  }
  async isElementExist(element) {
    const locator = await browser.$(element);
    return locator.isExisting();
  }

  async checkAccessibility() {
    const results = await new AxeBuilder({ client: browser }).analyze();

    expect(results.violations.length).to.be.greaterThan(0);
    try {
      fs.mkdirSync("./accessibility-report", { recursive: true });
      for (let i = 0; i < results.violations.length; i++) {
        fs.writeFileSync(
          `./accessibility-report/accessibility-violation-${i + 1}.json`,
          JSON.stringify(results.violations[i]),
        );
      }
      fs.writeFileSync(
        "./accessibility-report/accessibility-pass.json",
        JSON.stringify(results.passes),
      );
    } catch (e) {
      console.log("*********************************>>>>>>>>>>>>> " + e);
    }
  }

  async closeBrowser() {
    // Attempt to close the browser window
    browser
      .closeWindow()
      .then(() => {
        console.log("Window closed successfully.");
      })
      .catch((error) => {
        // Check if the error is due to an invalid session ID
        if (error.message.includes("invalid session id")) {
          console.error(
            "Encountered an invalid session ID. Starting a new session...",
          );

          // Start a new WebDriver session (replace with your specific setup)
          // Example: browser = webdriverio.remote(options);

          // Retry closing the window after starting a new session
          browser
            .closeWindow()
            .then(() => {
              console.log(
                "Window closed successfully after starting a new session.",
              );
            })
            .catch((newError) => {
              console.error(
                "Error closing the window after starting a new session:",
                newError,
              );
            });
        } else {
          console.error("Error closing the window:", error);
        }
      });
  }
}

module.exports = CommonActions;
// Create an instance of CommonActions
