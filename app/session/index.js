import { sendSessionEvent } from "../event/send-session-event.js";

export const entries = {
  application: "application",
  endemicsClaim: "endemicsClaim",
  farmerApplyData: "farmerApplyData",
  selectYourBusiness: "selectYourBusiness",
  organisation: "organisation",
  answers: "answers",
  pkcecodes: "pkcecodes",
  tokens: "tokens",
  customer: "customer",
  returnRoute: "returnRoute",
  cannotSignInDetails: "cannotSignInDetails"
};

function set(request, entryKey, key, value) {
  const entryValue = request.yar?.get(entryKey) || {};
  entryValue[key] = typeof value === "string" ? value.trim() : value;
  request.yar.set(entryKey, entryValue);
  const organisation = getEndemicsClaim(request, entries.organisation);
  const xForwardedForHeader = request.headers["x-forwarded-for"];
  const ip = xForwardedForHeader
    ? xForwardedForHeader.split(",")[0]
    : request.info.remoteAddress;
  sendSessionEvent(organisation, request.yar.id, entryKey, key, value, ip);
}

function get(request, entryKey, key) {
  return key ? request.yar?.get(entryKey)?.[key] : request.yar?.get(entryKey);
}

export function clear(request) {
  request.yar.clear(entries.endemicsClaim);
  request.yar.clear(entries.farmerApplyData);
  request.yar.clear(entries.application);
  request.yar.clear(entries.organisation);
  request.yar.clear(entries.answers);
  request.yar.clear(entries.selectYourBusiness);
  request.yar.clear(entries.customer);
  request.yar.clear(entries.returnRoute);
  request.yar.clear(entries.cannotSignInDetails);
}

export function clearAllOfSession(request) {
  Object.values(entries).forEach(value => request.yar.clear(value))
}

export function setApplication(request, key, value) {
  set(request, entries.application, key, value);
}

export function getApplication(request, key) {
  return get(request, entries.application, key);
}

export function setEndemicsClaim(request, key, value) {
  set(request, entries.endemicsClaim, key, value);
}

export function getEndemicsClaim(request, key) {
  return get(request, entries.endemicsClaim, key);
}

export function setFarmerApplyData(request, key, value) {
  set(request, entries.farmerApplyData, key, value);
}

export function getFarmerApplyData(request, key) {
  return get(request, entries.farmerApplyData, key);
}

export function setToken(request, key, value) {
  set(request, entries.tokens, key, value);
}

export function getToken(request, key) {
  return get(request, entries.tokens, key);
}

export function setPkcecodes(request, key, value) {
  set(request, entries.pkcecodes, key, value);
}

export function getPkcecodes(request, key) {
  return get(request, entries.pkcecodes, key);
}

export const setCustomer = (request, key, value) => {
  set(request, entries.customer, key, value);
};

export const getCustomer = (request, key) => {
  return get(request, entries.customer, key);
};

export const setReturnRoute = (request, key, value) => {
  set(request, entries.returnRoute, key, value);
};

export const getReturnRoute = (request, key) => {
  return get(request, entries.returnRoute, key);
};

export const setCannotSignInDetails = (request, key, value) => {
  set(request, entries.cannotSignInDetails, key, value);
};

export const getCannotSignInDetails = (request, key) => {
  return get(request, entries.cannotSignInDetails, key);
};
