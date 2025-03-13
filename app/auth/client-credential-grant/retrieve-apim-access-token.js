import Wreck from "@hapi/wreck";
import { config } from "../../config/index.js";
import { authConfig } from "../../config/auth.js";
import FormData from "form-data";

export const retrieveApimAccessToken = async (request) => {
  const endpoint = `${authConfig.apim.hostname}${authConfig.apim.oAuthPath}`;

  try {
    const data = new FormData();
    data.append("client_id", `${authConfig.apim.clientId}`);
    data.append("client_secret", `${authConfig.apim.clientSecret}`);
    data.append("scope", `${authConfig.apim.scope}`);
    data.append("grant_type", "client_credentials");

    const { payload } = await Wreck.post(endpoint, {
      headers: data.getHeaders(),
      payload: data,
      json: true,
      timeout: config.wreckHttp.timeoutMilliseconds,
    });

    return `${payload.token_type} ${payload.access_token}`;
  } catch (err) {
    request.logger.setBindings({ err, endpoint });
    throw err;
  }
};
