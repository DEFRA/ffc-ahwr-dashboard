import { getToken } from "../../session/index.js";
import { apiHeaders } from "../../constants/constants.js";
import { sessionKeys } from "../../session/keys.js";
import { authConfig } from "../../config/auth.js";
import { config } from "../../config/index.js";
import Wreck from "@hapi/wreck";

export const get = async (hostname, url, request, headers) => {
  headers[apiHeaders.xForwardedAuthorization] = getToken(
    request,
    sessionKeys.tokens.accessToken,
  );
  headers[apiHeaders.ocpSubscriptionKey] = authConfig.apim.ocpSubscriptionKey;

  const { payload } = await Wreck.get(`${hostname}${url}`, {
    headers,
    json: true,
    rejectUnauthorized: false,
    timeout: config.wreckHttp.timeoutMilliseconds,
  });

  return payload;
};
