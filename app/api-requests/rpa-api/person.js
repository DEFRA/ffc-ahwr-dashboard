import { get } from "./base.js";
import { authConfig } from "../../config/auth.js";

function formatPersonName(personSummary) {
  return [
    personSummary.firstName,
    personSummary.middleName,
    personSummary.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

export const getPersonSummary = async (request, apimAccessToken, crn, logger) => {
  const { hostname, getPersonSummaryUrl } = authConfig.ruralPaymentsAgency;

  const response = await get(hostname, getPersonSummaryUrl, request, {
    crn,
    Authorization: apimAccessToken,
  });

  const personSummary = response._data;

  logger.setBindings({ personSummaryId: personSummary.id });

  return { ...personSummary, name: formatPersonName(personSummary) };
};
