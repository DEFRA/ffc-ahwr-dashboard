import { getToken } from "../../session/index.js";
import { get } from "./base.js";
import { sessionKeys } from "../../session/keys.js";
import { authConfig } from "../../config/auth.js";
import { decodeJwt } from "../../auth/token-verify/jwt-decode.js";

export function getPersonName(personSummary) {
  return [
    personSummary.firstName,
    personSummary.middleName,
    personSummary.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function parsedAccessToken(request) {
  const accessToken = getToken(request, sessionKeys.tokens.accessToken);
  return decodeJwt(accessToken); //why?? It's already in session at sessionKeys.customer.crn
}

export const getPersonSummary = async (request, apimAccessToken) => {
  const { hostname, getPersonSummaryUrl } = authConfig.ruralPaymentsAgency;

  const crn = parsedAccessToken(request).contactId;
  const response = await get(hostname, getPersonSummaryUrl, request, {
    crn,
    Authorization: apimAccessToken,
  });
  return response._data;
};
