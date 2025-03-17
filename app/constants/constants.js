export const apiHeaders = {
  xForwardedAuthorization: "X-Forwarded-Authorization",
  ocpSubscriptionKey: "Ocp-Apim-Subscription-Key",
};

export const applicationType = {
  ENDEMICS: "EE",
  VET_VISITS: "VV",
};

export const applicationStatus = {
  AGREED: 1,
  WITHDRAWN: 2,
  IN_CHECK: 5,
  ACCEPTED: 6,
  NOT_AGREED: 7,
  PAID: 8,
  READY_TO_PAY: 9,
  REJECTED: 10,
  ON_HOLD: 11,
  RECOMMENDED_TO_PAY: 12,
  RECOMMENDED_TO_REJECT: 13,
  AUTHORISED: 14,
  SENT_TO_FINANCE: 15,
  PAYMENT_HELD: 16,
};

export const claimType = {
  review: "R",
  endemics: "E",
};

export const loginSources = {
  dashboard: "dashboard",
  apply: "apply",
  claim: "claim",
};

export const viewStatus = {
  AGREED: 1,
  WITHDRAWN: 2,
  IN_CHECK: 5,
  "IN CHECK": 5,
  ACCEPTED: 6,
  NOT_AGREED: 7,
  "NOT AGREED": 7,
  PAID: 8,
  READY_TO_PAY: 9,
  "READY TO PAY": 9,
  REJECTED: 10,
  ON_HOLD: 11,
  "ON HOLD": 11,
};

export const closedViewStatuses = [
  viewStatus.WITHDRAWN,
  viewStatus.REJECTED,
  viewStatus.NOT_AGREED,
  viewStatus.READY_TO_PAY,
];

export const farmerApply = "farmerApply";
