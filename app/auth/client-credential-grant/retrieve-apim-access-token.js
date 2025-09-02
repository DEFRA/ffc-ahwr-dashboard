import Wreck from "@hapi/wreck";
import { config } from "../../config/index.js";
import { authConfig } from "../../config/auth.js";
import FormData from "form-data";

let tokenCache = {
  tokenType: null,
  accessToken: null,
  expiresAt: 0, // ms
};

let inflightRefresh = null;

function isTokenValid(bufferSeconds = 60) {
  if (!tokenCache.accessToken) {
    return false;
  }
  const now = Date.now();
  const bufferMs = bufferSeconds * 1000;

  return now < (tokenCache.expiresAt - bufferMs);
}

function buildToken() {
  return `${tokenCache.tokenType} ${tokenCache.accessToken}`;
}

async function fetchNewToken() {
  const endpoint = `${authConfig.apim.hostname}${authConfig.apim.oAuthPath}`;

  const data = new FormData();
  data.append("client_id", String(authConfig.apim.clientId));
  data.append("client_secret", String(authConfig.apim.clientSecret));
  data.append("scope", String(authConfig.apim.scope));
  data.append("grant_type", "client_credentials");

  const { payload } = await Wreck.post(endpoint, {
    headers: data.getHeaders(),
    payload: data,
    json: true,
    timeout: config.wreckHttp.timeoutMilliseconds,
  });

  const expiresInSec = Number(payload?.expires_in) || 3600; // default to 3600 if absent
  const issuedAt = Date.now();

  tokenCache = {
    tokenType: payload.token_type || "Bearer",
    accessToken: payload.access_token,
    expiresAt: issuedAt + expiresInSec * 1000,
  };

  return tokenCache;
}


export async function retrieveApimAccessToken(request) {
  if (isTokenValid()) {
    request.logger.info('Reusing valid APIM token...');
    return buildToken();
  }

  // If another call is already refreshing, await it
  if (inflightRefresh) {
    await inflightRefresh;
    return buildToken();
  }

  inflightRefresh = (async () => {
    try {
      request.logger.info('Fetching a new APIM token...');
      await fetchNewToken();
    } catch (err) {
      request.logger.setBindings({
        err,
        apimTokenEndpoint:
          `${authConfig.apim.hostname}${authConfig.apim.oAuthPath}`,
      });
      throw err;
    } finally {
      inflightRefresh = null;
    }
  })();

  await inflightRefresh;

  return buildToken();
}

export function invalidateApimAccessToken() {
  tokenCache = { tokenType: null, accessToken: null, expiresAt: 0 };
}