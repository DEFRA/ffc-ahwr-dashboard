const { Given, When, Then } = require("@wdio/cucumber-framework");
const SelectBusinessPage = require("../pages/select-business-page");
const selectBusinessPage = new SelectBusinessPage();
const CommonActions = require("../pages/common-actions");
const commonPage = new CommonActions();

Given(/^the user is on the (.*) page$/, async function (page) {
  await selectBusinessPage.getHomePage(page);
});
When(/^start the application$/, async function () {
  await selectBusinessPage.clickOnStartButton();
});
When(
  /^user login with (.*) business crn and password\(for DefraId\)$/,
  async function (business) {
    await selectBusinessPage.signInWithDefraId(business);
  },
);
When(/^make the agreement status to withdrawn$/, async function () {
  await selectBusinessPage.updateWithdrawStatus();
});

When(/^running accessbility tests$/, async function () {
  await commonPage.checkAccessibility();
});
When(/^select the (.*) for application$/, async function (businessName) {
  await selectBusinessPage.clickOnBusiness(businessName);
});
When(/^click on continue button$/, async function () {
  await selectBusinessPage.clickOnContinue();
});
// org-review
When(/^user check the business details$/, async function () {
  await selectBusinessPage.singleUserBusinessDetail();
});
When(/^user confirm the org-review page$/, async function () {
  await selectBusinessPage.checkFarmerDetails();
});
When(/^user agreed the business details is correct$/, async function () {
  await selectBusinessPage.farmerAcceptDetails();
});
Then(/^user continue to next page$/, async function () {
  await selectBusinessPage.proceedWithApplication();
}) |
  Then(/^Accept the Cookies$/, async function () {
    await selectBusinessPage.acceptCookies();
  });
// SELECT LIVESTOCK
When(/^user is on the livestock page$/, async function () {
  await selectBusinessPage.livestockPage();
});
When(/^user check if livestock are listed$/, async function () {
  await selectBusinessPage.livestockList();
});
When(/^user choose (.*) cattle for review$/, async function (LiveStockName) {
  await selectBusinessPage.liveStockReview(LiveStockName);
});
Then(/^User continue the application$/, async function () {
  await selectBusinessPage.continueTheApplication();
});
// ANIMAL ELIGIBILITY
When(
  /^user check the minimum number of livestock required to qualify for the review$/,
  async function () {
    await selectBusinessPage.minimumRequirement();
  },
);
When(/^user confirm to meet the requirement$/, async function () {
  await selectBusinessPage.accurateLivestockNumber();
});
When(/^the user continue the application$/, async function () {
  await selectBusinessPage.next();
});
Then(/^user check the answer$/, async function () {
  await selectBusinessPage.checkAnswerToBeAccurate();
  await selectBusinessPage.goToDeclaration();
});
// DECLARATION PAGE
When(/^user is on the declaration page$/, async function () {
  await selectBusinessPage.declarationUrl();
});
When(/^user view the page title$/, async function () {
  await selectBusinessPage.agreementReview();
});
When(/^user read through the full terms and conditions$/, async function () {
  await selectBusinessPage.conditionTab();
});
When(/^user accept the terms and conditions$/, async function () {
  await selectBusinessPage.termsAndConditionTitle();
  await selectBusinessPage.agreeToTerms();
});
Then(/^user (.*) the application$/, async function (type) {
  await selectBusinessPage.termsCheckBox();
  await selectBusinessPage.applicationCompleted(type);
});
Then(/^user should see successful message$/, async function () {
  await selectBusinessPage.successfulMessage();
});
//Exception

When(/^validate the error message in the Header$/, async function () {
  await selectBusinessPage.validateExceptionHeader();
});
When(
  /^validate exception error message for (.*)$/,
  async function (typeOfException) {
    await selectBusinessPage.exceptionErrorMessage(typeOfException);
  },
);
When(/^validate call charges screen$/, async function () {
  await selectBusinessPage.validateCallCharges();
});
//database connection

When(/^pass the agreement number to (.*)$/, async function (type) {
  await selectBusinessPage.connectTODatabase(type);
});

When(/^agreement number is passed to (.*)$/, async function (date) {
  await selectBusinessPage.updateDate(date);
});

Then(/^close browser$/, async function () {
  await selectBusinessPage.closeBrowser1();
});
Then(/^validate the error message$/, async function () {
  await selectBusinessPage.validateApplicationExistsSingleBusiness();
});

Then(/^validate the error message for multiple business$/, async function () {
  await selectBusinessPage.validateApplicationExistsMultipleBusiness();
});
Then(/^Confirm that the status is set to Agreed$/, async function () {
  await selectBusinessPage.validAgreedStatus();
});
When(/^fetch the agreement number$/, async function () {
  await selectBusinessPage.getAgreementNumber();
});
When(/^delete the entry$/, async function () {
  await selectBusinessPage.deleteEntry();
});

//endemics

Then(/^agree Reviews and follow up for the same species$/, async function () {
  await selectBusinessPage.click_Agree();
});
Then(/^agree the Minimum number of livestock$/, async function () {
  await selectBusinessPage.click_Agree();
});
Then(/^agree Timing of vet visits and funding claims$/, async function () {
  await selectBusinessPage.click_Agree();
});
Then(
  /^Validate if the user had landed on minimun live stock page$/,
  async function () {
    await selectBusinessPage.validate_minimum_livestock_header();
  },
);
Then(/^user confirm Review Page$/, async function () {
  await selectBusinessPage.validate_Review_Page();
});
Then(
  /^Validate if the user had landed on timining and funding$/,
  async function () {
    await selectBusinessPage.validate_timing_and_funding();
  },
);
Then(
  /^Validate if the user had landed on review agreement offer$/,
  async function () {
    await selectBusinessPage.validate_review_agreement_offer();
  },
);
Then(/^user click on Reject$/, async function () {
  await selectBusinessPage.reject_Agreement();
});
Then(/^Validate the reject agreement offer$/, async function () {
  await selectBusinessPage.validate_reject_agreement_offer();
});
Then(/^user clicks on back link$/, async function () {
  await selectBusinessPage.click_Back_Link();
});
Then(/^click on gov.uk in the left pane$/, async function () {
  await selectBusinessPage.clickGovUKPane();
});
Then(/^validate if the user redirected to gov.uk$/, async function () {
  await selectBusinessPage.urlValidation();
});
Then(
  /^user is able to see the Annual health and welfare review of livestock link on the middle top of the header$/,
  async function () {
    await selectBusinessPage.getHeaderText();
  },
);
Then(/^user clicks on the service name link$/, async function () {
  await selectBusinessPage.clickAHWR();
});
Then(
  /^user must be redirected to service guidance start pages$/,
  async function () {
    await selectBusinessPage.urlValidationAHWR();
  },
);
//dashboard
When(/^redirected to Defra ID page$/, async function () {
  await selectBusinessPage.DefraIdPage();
});
Then(/^user confirm manage your claims page$/, async function () {
  await selectBusinessPage.validate_manage_your_claims_page();
});
Then(/^user checks your previous claims text$/, async function () {
  await selectBusinessPage.validate_your_previous_claims_text_header();
});
Then(/^validate empty dashboard history message$/, async function () {
  await selectBusinessPage.validate_dashboard_history_message();
});
When(/^user scrolls to bottom of the page$/, async function () {
  await selectBusinessPage.scroll_dashboard_page();
});
Then(/^confirm terms and conditions link is visible$/, async function () {
  await selectBusinessPage.validate_terms_and_conditions_link_exists();
});
Then(/^confirm guidance for review link is visible$/, async function () {
  await selectBusinessPage.validate_guidance_for_review_link_exists();
});
Then(/^confirm agreement summary link is visible$/, async function () {
  await selectBusinessPage.validate_agreement_summary_link_exists();
});
Then(/^confirm feedback link is visible$/, async function () {
  await selectBusinessPage.validate_feedback_link_exists();
});

When(/^user clicks on the feedback link$/, async function () {
  await selectBusinessPage.click_feedback_link();
});

Then(/^validate user redirected to survey page$/, async function () {
  await selectBusinessPage.validate_redirect_survey_page();
});
