import { get } from "./base.js";
import { getCustomer } from "../../session/index.js";
import { sessionKeys } from "../../session/keys.js";
import { authConfig } from "../../config/auth.js";

export const getCphNumbers = async (request, apimAccessToken) => {
  const response = await get(
    authConfig.ruralPaymentsAgency.hostname,
    authConfig.ruralPaymentsAgency.getCphNumbersUrl.replace(
      "organisationId",
      getCustomer(request, sessionKeys.customer.organisationId),
    ),
    request,
    {
      crn: getCustomer(request, sessionKeys.customer.crn),
      Authorization: apimAccessToken,
    },
  );

  if (!response.success) {
    return null;
  }
  return response.data.map((cph) => cph.cphNumber);
};
