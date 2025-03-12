const CommonActions = require("./common-actions");
const { expect } = require("chai");
const pgp = require("pg-promise")();

const databaseConfig = {
  user: "adminuser@sndffcdbssq1002",
  host: "sndffcdbssq1002.postgres.database.azure.com",
  port: 5432,
  database: "ffc_ahwr_application",
};

// Dynamically set the password based on your requirements
const password = process.env.DB_PASSWORD;

// Create the connection string
const connectionString = `postgres://${databaseConfig.user}:${password}@${databaseConfig.host}:${databaseConfig.port}/${databaseConfig.database}?sslmode=require`;

// Create the database connection
const db = pgp(connectionString);

// Now, 'db' is your database connection with the dynamic password.

// select business element

const START_BUTTON = '//*[@id="main-content"]/div/div/a';
const BUSINESS_EMAIL = "1105110119@email.com";
const RPA_CONTACT = ".govuk-details";
const PAGE_TITLE = "Annual health and welfare review of livestock";
const SELECT_BUSINESS = "Which business";
const BUSINESS_NAME = "Farm";
const CONTACT = "Telephone";
const BUSINESS_CHECK_BUTTON = "#whichBusiness";
const NO_BUSINESS_CONTENT = ".govuk-details__text";
const BUSINESS_LIST = '[for="whichBusiness"]';
// org-review element
const CHECK_DETAILS = ".govuk-heading-l";
const FARMER_DETAILS = ".govuk-summary-list";
const DETAILS_BUTTON = "#confirmCheckDetails";
const CONTINUE_BUTTON = "#btnContinue";
const DETAILS = "Check your details";
const CONTENT = "Farmer name";
const REVIEW = "Which livestock do you want a review for?";
// select livestock page
const WHICH_REVIEW = ".govuk-fieldset__heading";
const LIVESTOCK_TYPE = '[data-module="govuk-radios"]';
const SHEEP = "#whichReview-3";
const PIGS = "#whichReview-4";
const DAIRY_CATTLE = "#whichReview-2";
const BEEF_CATTLE = "#whichReview";
const LIVESTOCK = "Sheep";
// eligibility page
const REQUIRE_LIVESTOCK_NUMBER = "#eligibleSpecies-hint";
const CONFIRM_ELIGIBILITY = "#eligibleSpecies";
const DECLARATION = '[role="button"]';
const TERMS_CONDITIONS = "#termsAndConditionsUri";
const TERMS_AND_CONDITION_BOX = "#terms";
const COMPLETE_APPLICATION = '[value="accepted"]';
const COOKIES_ACCEPT = '[value="accept"]';
const COOKIES_HIDE = "/html/body/div[1]/div/div[2]/div[2]";
const REJECT_APPLICATION = '[value="rejected"]';
const SUCCESS_MESSAGE = ".govuk-panel__title";
const ACCURATE_ANSWER = "Check your answers";
const AGREED = "declaration";
const REVIEW_AGREED = "agreement";
const TERMS =
  "Annual health and welfare review of livestock terms and conditions";
const MESSAGE = "Application complete";
const LIVESTOCK_NUMBER = "eligible for funding";

//'div.govuk-radios>div.govuk-radios__item>label'
//DefraID
const DEFRA_CRN = "#crn";
const DEFRA_PASSWORD = "#password";
const SIGN_IN_BUTTON = "#next";
const HIDE_COOKIES = '[data-hide-cookie-banner="true"]';
const EMAIL_INPUT = "#email";
const CONTINUE = "#submit";
const MUTLIPLE_BUSINESS_CONTINUE = "#continueReplacement";
//Exception
const EXCEPTION_HEADER = ".govuk-heading-l";
const HEADER_ERROR_MESSAGE_EXPECTED =
  "You cannot apply for a livestock review for this business";
const EXCEPTION_ERROR_MESSAGE = ".govuk-heading-l+.govuk-body";
const EXCEPTION_ERROR_MESSAGE_EXPECTED =
  "You do not have the required permission to act for W S Hirst - SBI 107097991.";
const EXCEPTION_ERROR_MESSAGE_EXPECTED_NO_CPH =
  "Mr M A Burdon - SBI 200259426 has no eligible county parish holding (CPH) number registered to it.";
const EXCEPTION_ERROR_MESSAGE_EXPECTED_MB_NO_PERMISSION =
  "You do not have the required permission to act for Lonsdale Health - SBI 106240540.";
const EXCEPTION_ERROR_MESSAGE_EXPECTED_MB_NO_CPH =
  "Mr R Chapman has no eligible county parish holding (CPH) number registered to it.";
const EXPECTED_ERROR =
  "has already applied for an annual health and welfare review of livestock.";
const EXPECTED_ERROR_FOR_MULTIPLEBUSINESS =
  "applied for an annual health and welfare review of livestock";
const CALL_CHARGES = ".govuk-grid-column-full>p>.govuk-link";
const CALL_CHARGES_TITLE = "Call charges and phone numbers - GOV.UK";
//10 month rule
const AGREEMENT_NUMBER = ".govuk-panel__body>strong";
const REJECT_OFFER = '//*[@id="submitDeclarationForm"]/div[2]/button[2]';
let checkStatus_query;
let updateStatus_query;
let sbiValue;
let AGREEMENT_NUMBER_VALUE;
const actualStatus = 1;
let fetchedValue;

//Endemics
let ACCEPT_AGREEMENT = '[value="agree"]';
let REJECT_AGREEMENT = '[value="notAgree"]';
let REJECT_AGREEMENT_ERROR_MESSAGE = "Agreement terms rejected";
let REJECT_AGREEMENT_ERROR = '//*[@id="main-content"]/div/div/h1';
let BACK = "#back";
let GOV_UK = ".govuk-header__logotype-text";
let GOV_UK_LINK = "https://www.gov.uk/";
let HEADER = ".govuk-heading-l";
let REVIEW_HEADER = "Reviews and follow-ups must be for the same species";
let MINIMUM_LIVESTOCK_HEADER = "Minimum number of livestock";
let TIMING_AND_FUNDING = "Timing of vet visits and funding claims";
let REVIEW_AGREEMENT_OFFER = "Review your agreement offer";
let AGREEMENT_OFFER_REJECTED = "Agreement offer rejected";
let AHWR_HEADER = ".govuk-header__content";
let EXPECTED_AHWR_HEADER = "Annual health and welfare review of livestock";
let AHWR_URL = "https://ffc-ahwr-farmer-dev.azure.defra.cloud/apply";
//Dashboard
const URL_CONTENT = "dcidm";
const HEADER_MANAGE_YOUR_CLAIMS_ACTUAL = '//h1[@class="govuk-heading-xl"]';
const HEADER_MANAGE_YOUR_CLAIMS_EXPECTED = "Manage your claims";
const HEADER_HISTORY_DASHBOARD_ACTUAL =
  '//h3[@class="govuk-heading-m govuk-!-static-margin-top-2"]';
const HEADER_HISTORY_DASHBOARD_EXPECTED = "Your previous claims";
const HISTORY_MESSAGE_ACTUAL = '//*[@id="main-content"]/div[2]/div/p[1]';
const HISTORY_MESSAGE_EXPECTED =
  "Your claims will appear here when you have made them";
//const ELEMENT_SCROLL_HEADER= '//h3[@class="govuk-heading-m govuk-!-static-margin-top-4"]'
const TERMS_AND_CONDITIONS_LINK_TEXT_ACTUAL =
  '//a[text()="Terms and conditions for reviewing the health and welfare of your livestock"]';
const TERMS_AND_CONDITIONS_LINK_TEXT_EXPECTED =
  "Terms and conditions for reviewing the health and welfare of your livestock";
const GUIDANCE_FOR_REVIEW_LINK_TEXT_ACTUAL =
  '//a[text()="Guidance for reviewing the health and welfare of your livestock"]';
const GUIDANCE_FOR_REVIEW_LINK_TEXT_EXPECTED =
  "Guidance for reviewing the health and welfare of your livestock";
const AGREEMENT_SUMMARY_ACTUAL = '//a[text()="Agreement summary"]';
const AGREEMENT_SUMMARY_EXPECTED = "Agreement summary";
const FEEDBACK_LINK_ACTUAL = '//a[text()="feedback"]';
const FEEDBACK_LINK_EXPECTED = "feedback";
const SURVEY_LINK =
  "https://forms.office.com/Pages/ResponsePage.aspx?id=UCQKdycCYkyQx044U38RAsIdAEqqafZCk2LjifrI4h1UOVJKOVRUWlBLMEpFQVdERzA3QVRFWUM2NS4u";

class SelectBusinessPage extends CommonActions {
  async getHomePage(page) {
    await this.open(page);
  }
  async clickOnStartButton() {
    try {
      const sleep = (waitTimeInMs) =>
        new Promise((resolve) => setTimeout(resolve, waitTimeInMs));
      await sleep(5000);
      await this.clickOn(START_BUTTON);
    } catch (error) {
      console.log(error.message);
    }
  }

  async pageTitle() {
    await this.getPageTitle(PAGE_TITLE);
  }

  async businessPage() {
    await this.elementToContainText(CHECK_DETAILS, SELECT_BUSINESS);
  }

  async listOfBusiness() {
    await this.elementToContainText(BUSINESS_LIST, BUSINESS_NAME);
  }

  async selectBusiness() {
    await this.clickOn(BUSINESS_CHECK_BUTTON);
  }

  async checkContact() {
    await this.clickOn(RPA_CONTACT);
  }

  async contactDetails() {
    await this.elementToContainText(NO_BUSINESS_CONTENT, CONTACT);
  }

  async startApplication() {
    await this.clickOn(CONTINUE_BUTTON);
  }

  async acceptCookies() {
    await this.clickOn(COOKIES_ACCEPT);
    await this.clickOn(COOKIES_HIDE);
  }
  // org review
  async singleUserBusinessDetail() {
    const sleep = (waitTimeInMs) =>
      new Promise((resolve) => setTimeout(resolve, waitTimeInMs));
    await sleep(5000);

    await this.elementTextShouldBe(CHECK_DETAILS, DETAILS);
  }

  async checkFarmerDetails() {
    await this.elementToContainText(FARMER_DETAILS, CONTENT);
  }

  async farmerAcceptDetails() {
    await this.clickOn(DETAILS_BUTTON);
  }

  async proceedWithApplication() {
    await this.clickOn(CONTINUE_BUTTON);
  }

  async clickOnBusiness(businessName) {
    // Define the xPath function
    function xPath(businessName) {
      return `//*[@id="resultsContainer"]/div/fieldset/div/div[label[contains(text(),"${businessName}")]]/label`;
    }
    // Generate the XPath expression using the xPath function
    const xPathExpression = xPath(businessName);
    // Now you can use the xPathExpression in your WebDriverIO code
    const radio_Button = await $(xPathExpression);
    await this.clickOn(radio_Button);
  }
  // which-review
  async livestockPage() {
    await this.elementTextShouldBe(WHICH_REVIEW, REVIEW);
  }

  async livestockList() {
    await this.elementToContainText(LIVESTOCK_TYPE, LIVESTOCK);
  }
  async liveStockReview(LiveStockName) {
    switch (LiveStockName) {
      case "Sheep":
        await this.clickOn(SHEEP);
        break;
      case "Beef":
        await this.clickOn(BEEF_CATTLE);
        break;
      case "Dairy":
        await this.clickOn(DAIRY_CATTLE);
        break;
      case "Pigs":
        await this.clickOn(PIGS);
        break;
      default:
        // Handle the default case if needed
        break;
    }
  }

  async continueTheApplication() {
    await this.clickOn(CONTINUE_BUTTON);
  }
  // eligible livestock
  async minimumRequirement() {
    await this.elementToContainText(REQUIRE_LIVESTOCK_NUMBER, LIVESTOCK_NUMBER);
  }

  async accurateLivestockNumber() {
    await this.clickOn(CONFIRM_ELIGIBILITY);
  }

  async next() {
    await this.clickOn(CONTINUE_BUTTON);
  }

  async checkAnswerToBeAccurate() {
    await this.elementTextShouldBe(CHECK_DETAILS, ACCURATE_ANSWER);
  }

  async goToDeclaration() {
    await this.clickOn(DECLARATION);
  }

  // COMPLETE JOURNEY
  async declarationUrl() {
    await this.urlContain(AGREED);
  }

  async agreementReview() {
    await this.elementToContainText(CHECK_DETAILS, REVIEW_AGREED);
  }

  async conditionTab() {
    await this.clickOn(TERMS_CONDITIONS);
  }

  async termsAndConditionTitle() {
    await this.elementToContainText(CHECK_DETAILS, TERMS);
  }

  async agreeToTerms() {
    await this.clickOn(DECLARATION);
  }

  async termsCheckBox() {
    await this.clickOn(TERMS_AND_CONDITION_BOX);
  }

  async applicationCompleted(type) {
    if (type == "complete") {
      await this.clickOn(COMPLETE_APPLICATION);
    } else if (type == "reject") {
      await this.clickOn(REJECT_OFFER);
    }
  }

  async successfulMessage() {
    await this.elementToContainText(SUCCESS_MESSAGE, MESSAGE);
  }
  async signInButton() {
    await this.clickOn(SIGN_IN_BUTTON);
  }

  async inputValidCrn(crn) {
    await this.sendKey(DEFRA_CRN, crn);
  }
  async inputPassword(password) {
    await this.sendKey(DEFRA_PASSWORD, password);
  }
  async submit() {
    await this.clickOn(CONTINUE);
  }
  async inputCredentials(credential) {
    await this.sendKey(EMAIL_INPUT, credential);
  }
  async signInWithDefraId(business) {
    const sleep = (waitTimeInMs) =>
      new Promise((resolve) => setTimeout(resolve, waitTimeInMs));
    await sleep(10000);
    if (business == "Single") {
      await this.inputValidCrn(process.env.CRN_USERNAME);
      await this.inputPassword(process.env.CRN_PASSWORD);
    } else if (business == "Multiple") {
      console.log(process.env.CRN_MULTI_USERNAME);
      await this.inputValidCrn(process.env.CRN_MULTI_USERNAME);
      await this.inputPassword(process.env.CRN_PASSWORD);
    } else if (business == "Exception-SB-NP") {
      console.log(process.env.CRN_EXCEPTION_USERNAME);
      await this.inputValidCrn(process.env.CRN_EXCEPTION_USERNAME);
      await this.inputPassword(process.env.CRN_EXCEPTION_PASSWORD);
    } else if (business == "Exception-SB-NCPH") {
      console.log(process.env.CRN_EXCEPTION_USERNAME);
      await this.inputValidCrn(process.env.CRN_EXCEPTION_USERNAME_NOCPH);
      await this.inputPassword(process.env.CRN_EXCEPTION_PASSWORD);
    } else if (business == "Exception-MB-NP") {
      console.log(process.env.CRN_EXCEPTION_USERNAME);
      await this.inputValidCrn(process.env.CRN_EXCEPTION_USERNAME_MB_NP);
      await this.inputPassword(process.env.CRN_EXCEPTION_PASSWORD);
    } else if (business == "Exception-MB-NCPH") {
      console.log(process.env.CRN_EXCEPTION_USERNAME);
      await this.inputValidCrn(process.env.CRN_EXCEPTION_USERNAME_MB_NOCPH);
      await this.inputPassword(process.env.CRN_EXCEPTION_PASSWORD);
    }
    await this.signInButton();
    await sleep(10000);
  }
  async clickOnContinue() {
    await this.clickOn(MUTLIPLE_BUSINESS_CONTINUE);
  }

  //Exception

  async validateExceptionHeader() {
    const sleep = (waitTimeInMs) =>
      new Promise((resolve) => setTimeout(resolve, waitTimeInMs));
    await sleep(10000);
    await this.elementToContainText(
      EXCEPTION_HEADER,
      HEADER_ERROR_MESSAGE_EXPECTED,
    );
  }

  async exceptionErrorMessage(typeOfException) {
    const sleep = (waitTimeInMs) =>
      new Promise((resolve) => setTimeout(resolve, waitTimeInMs));
    await sleep(10000);

    switch (typeOfException) {
      case "SB-NO Permission":
        await this.elementToContainText(
          EXCEPTION_ERROR_MESSAGE,
          EXCEPTION_ERROR_MESSAGE_EXPECTED,
        );
        break;
      case "SB-NO CPH":
        await this.elementToContainText(
          EXCEPTION_ERROR_MESSAGE,
          EXCEPTION_ERROR_MESSAGE_EXPECTED_NO_CPH,
        );
        break;
      case "MB-NO Permission":
        await this.elementToContainText(
          EXCEPTION_ERROR_MESSAGE,
          EXCEPTION_ERROR_MESSAGE_EXPECTED_MB_NO_PERMISSION,
        );
        break;
      case "MB-NO CPH":
        await this.elementToContainText(
          EXCEPTION_ERROR_MESSAGE,
          EXCEPTION_ERROR_MESSAGE_EXPECTED_MB_NO_CPH,
        );
        break;
      default:
        // Handle other cases or throw an error if needed
        break;
    }
  }

  async validateCallCharges() {
    await this.clickOn(CALL_CHARGES);
    //  let expectedPageTitle =await this.getPageTitle()
    // console.log('*************'+expectedPageTitle)
    const windowHandles = await browser.getWindowHandles();
    await browser.switchToWindow(windowHandles[1]);
    let expectedPageTitle = await this.getPageTitle();
    console.log(expectedPageTitle);
    await expect(expectedPageTitle).to.include(CALL_CHARGES_TITLE);
    await browser.closeWindow();
    await browser.switchToWindow(windowHandles[0]);
  }

  async updateWithdrawStatus() {
    const sleep = (waitTimeInMs) =>
      new Promise((resolve) => setTimeout(resolve, waitTimeInMs));
    await sleep(5000);
    try {
      let text = await this.elementGetText(EXCEPTION_ERROR_MESSAGE);
      const regex = /SBI (\d+)/; // Define a regular expression pattern to match "SBI" followed by numbers.
      const match = text.match(regex); // Search for the pattern in the text.

      if (match) {
        sbiValue = match[1]; // Extract the SBI number from the first capturing group.
        console.log(sbiValue); // Output the SBI number to the console.
      } else {
        console.log("SBI number not found in the text.");
      }
      // Replace this with your actual SBI value

      // Step 1: Define the Azure SQL Database connection configuration
      const conn = await db.connect();

      // Step 3: Update status in the database
      const updateStatusQuery = `
    UPDATE public.application
    SET "statusId" = 2
    WHERE data->'organisation'->>'sbi' = $1;
  `;

      // Execute the query with the SBI value as a parameter
      db.none(updateStatusQuery, [sbiValue])
        .then(() => {
          console.log("Status updated successfully.");
        })
        .catch((error) => {
          console.error("Error updating status:", error);
        })
        .finally(() => {
          // Close the database connection (optional)
          conn.done();
        });
    } catch (err) {
      console.error("Error:", err);
    }
  }

  async connectTODatabase(type) {
    const sleep = (waitTimeInMs) =>
      new Promise((resolve) => setTimeout(resolve, waitTimeInMs));
    await sleep(5000);
    try {
      // Step 1: Define the Azure SQL Database connection configuration
      const conn = await db.connect();

      let query = "";

      if (type === "updateStatus") {
        // Step 3: Update status in the database
        const updateStatusQuery = `
        UPDATE public.application
        SET "statusId" = 2
        WHERE reference = $1;
      `;

        const value = AGREEMENT_NUMBER_VALUE; // The reference value
        db.none(updateStatusQuery, AGREEMENT_NUMBER_VALUE)
          .then(() => {
            console.log("Status updated successfully.");
          })
          .catch((error) => {
            console.error("Error updating status:", error);
          })
          .finally(() => {
            // Close the database connection (optional)
          });
      } else if (type === "checkStatus") {
        // Define a SQL query to fetch the value from the database
        const query = `
  SELECT "statusId" FROM public.application WHERE reference = $1;
`;

        // Execute the SQL query to fetch the value
        fetchedValue = await db
          .one(query, AGREEMENT_NUMBER_VALUE)
          .then((result) => {
            // 'result' contains the value fetched from the database
            //fetchedValue = result.statusId; // Corrected to access 'statusId' property
            console.log("Fetched Value:", result.statusId);
            return result.statusId;

            // You can now use 'fetchedValue' as needed in your code
          })
          .catch((error) => {
            console.error("Error:", error);
          });
        // Release the connection
        conn.done();
      } else if (type === "Incheck") {
        // Step 3: Update status in the database
        const updateStatusQuery = `
        UPDATE public.application
        SET "statusId" = 5
        WHERE reference = $1;
      `;

        const value = AGREEMENT_NUMBER_VALUE; // The reference value
        db.none(updateStatusQuery, [value])
          .then(() => {
            console.log("Status updated successfully.");
          })
          .catch((error) => {
            console.error("Error updating status:", error);
          })
          .finally(() => {
            // Close the database connection (optional)
          });
      } else if (type === "ReadyToPay") {
        // Step 3: Update status in the database
        const updateStatusQuery = `
        UPDATE public.application
        SET "statusId" = 9
        WHERE reference = $1;
      `;

        const value = AGREEMENT_NUMBER_VALUE; // The reference value
        db.none(updateStatusQuery, [value])
          .then(() => {
            console.log("Status updated successfully.");
          })
          .catch((error) => {
            console.error("Error updating status:", error);
          })
          .finally(() => {
            // Close the database connection (optional)
          });
      }
    } catch (err) {
      console.error("Error:", err);
    }

    // Close the WebDriverIO browser session when done
    await browser.deleteSession();
  }

  async updateDate(createdDate) {
    const sleep = (waitTimeInMs) =>
      new Promise((resolve) => setTimeout(resolve, waitTimeInMs));
    await sleep(5000);
    try {
      // Step 1: Define the Azure SQL Database connection configuration
      const conn = await db.connect();

      let query = `
  UPDATE public.application
  SET "createdAt" = $2,
      "updatedAt" = $2
  WHERE reference = $1;
`;
      //AGREEMENT_NUMBER_VALUE='AHWR-8092-E593'
      db.none(query, [AGREEMENT_NUMBER_VALUE, createdDate])
        .then(() => {
          console.log("Status updated successfully.");
        })
        .catch((error) => {
          console.error("Error updating status:", error);
        })
        .finally(() => {
          // Close the database connection (optional)
        });
    } catch (err) {
      console.error("Error:", err);
    }

    // Close the WebDriverIO browser session when done
    await browser.deleteSession();
  }

  async validAgreedStatus() {
    await this.elementValidateText(fetchedValue, actualStatus);
  }

  async getAgreementNumber() {
    console.log(browser.getCookies());
    AGREEMENT_NUMBER_VALUE = await this.elementGetText(AGREEMENT_NUMBER);
    return AGREEMENT_NUMBER_VALUE;
  }

  async validateApplicationExistsSingleBusiness() {
    await this.elementToContainText(EXCEPTION_ERROR_MESSAGE, EXPECTED_ERROR);
  }

  async validateApplicationExistsMultipleBusiness() {
    await this.elementToContainText(
      EXCEPTION_ERROR_MESSAGE,
      EXPECTED_ERROR_FOR_MULTIPLEBUSINESS,
    );
  }

  async closeBrowser1() {
    // Use the promise interface to close the browser
    // Use the callback interface to close the browser
    await this.closeBrowser();
  }

  async deleteEntry() {
    const updateStatusQuery = `
    DELETE FROM public.application 
    WHERE data->'organisation'->>'sbi' = $1;
      `;

    const value = AGREEMENT_NUMBER_VALUE; // The reference value
    db.none(updateStatusQuery, [value])
      .then(() => {
        console.log("Status updated successfully.");
      })
      .catch((error) => {
        console.error("Error updating status:", error);
      })
      .finally(() => {
        // Close the database connection (optional)
      });
  }
  //endemics

  async click_Agree() {
    await this.clickOn(ACCEPT_AGREEMENT);
  }

  async validate_Review_Page() {
    await this.elementToContainText(HEADER, REVIEW_HEADER);
  }

  async validate_minimum_livestock_header() {
    await this.elementToContainText(HEADER, MINIMUM_LIVESTOCK_HEADER);
  }

  async validate_timing_and_funding() {
    await this.elementToContainText(HEADER, TIMING_AND_FUNDING);
  }

  async validate_review_agreement_offer() {
    await this.elementToContainText(HEADER, REVIEW_AGREEMENT_OFFER);
  }

  async validate_reject_agreement_offer() {
    await this.elementToContainText(HEADER, AGREEMENT_OFFER_REJECTED);
  }
  async click_Back_Link() {
    await this.clickOn(BACK);
  }

  async clickGovUKPane() {
    const sleep = (waitTimeInMs) =>
      new Promise((resolve) => setTimeout(resolve, waitTimeInMs));
    await sleep(5000);
    const zoomPercentage1 = 100;
    browser.execute((zoom) => {
      document.body.style.zoom = `${zoom}%`;
    }, zoomPercentage1);
    // await this.clickOn(HIDE_COOKIES)
    // await this.clickOn(SIGN_IN_BUTTON)
    await this.clickOn(GOV_UK);
  }

  async reject_Agreement() {
    await this.clickOn(REJECT_APPLICATION);
  }

  async urlValidation() {
    await this.urlContain(GOV_UK_LINK);
  }

  async getHeaderText() {
    await this.elementToContainText(AHWR_HEADER, EXPECTED_AHWR_HEADER);
  }
  async clickAHWR() {
    await this.clickOn(AHWR_HEADER);
  }
  async urlValidationAHWR() {
    await this.urlContain(AHWR_URL);
  }

  //dashboard

  async DefraIdPage() {
    await this.urlContain(URL_CONTENT);
  }
  async validate_manage_your_claims_page() {
    await this.elementToContainText(
      HEADER_MANAGE_YOUR_CLAIMS_ACTUAL,
      HEADER_MANAGE_YOUR_CLAIMS_EXPECTED,
    );
  }

  async validate_your_previous_claims_text_header() {
    await this.elementToContainText(
      HEADER_HISTORY_DASHBOARD_ACTUAL,
      HEADER_HISTORY_DASHBOARD_EXPECTED,
    );
  }

  async validate_dashboard_history_message() {
    await this.elementToContainText(
      HISTORY_MESSAGE_ACTUAL,
      HISTORY_MESSAGE_EXPECTED,
    );
  }
  async scroll_dashboard_page() {
    const element = await $("ELEMENT_SCROLL_HEADER");
    await element.scrollIntoView();
  }
  async validate_terms_and_conditions_link_exists() {
    await this.elementToContainText(
      TERMS_AND_CONDITIONS_LINK_TEXT_ACTUAL,
      TERMS_AND_CONDITIONS_LINK_TEXT_EXPECTED,
    );
  }
  async validate_guidance_for_review_link_exists() {
    await this.elementToContainText(
      GUIDANCE_FOR_REVIEW_LINK_TEXT_ACTUAL,
      GUIDANCE_FOR_REVIEW_LINK_TEXT_EXPECTED,
    );
  }
  async validate_agreement_summary_link_exists() {
    await this.elementToContainText(
      AGREEMENT_SUMMARY_ACTUAL,
      AGREEMENT_SUMMARY_EXPECTED,
    );
  }
  async validate_feedback_link_exists() {
    await this.elementToContainText(
      FEEDBACK_LINK_ACTUAL,
      FEEDBACK_LINK_EXPECTED,
    );
  }
  async click_feedback_link() {
    await this.clickOn(FEEDBACK_LINK_ACTUAL);
  }
  async validate_redirect_survey_page() {
    await this.switchToWindow();
    await this.urlContain(SURVEY_LINK);
    await this.screenShot();
    await this.switchToOldWindow();
  }
}
module.exports = SelectBusinessPage;
