import { config } from "../config/index.js";
import { requestAuthorizationCodeUrl } from "../auth/auth-code-grant/request-authorization-code-url.js";
import { sessionKeys } from "../session/keys.js";
import { getEndemicsClaim } from "../session/index.js";

const {
  endemicsClaim: { organisation: organisationKey },
} = sessionKeys;

export const authPlugin = {
  plugin: {
    name: "auth",
    register: async (server, _) => {
      server.auth.strategy("session", "cookie", {
        cookie: {
          isSameSite: config.cookie.isSameSite,
          isSecure: config.cookie.isSecure,
          name: config.cookie.cookieNameAuth,
          password: config.cookie.password,
          path: config.cookiePolicy.path,
          ttl: config.cookie.ttl,
        },
        keepAlive: true,
        redirectTo: (request) => {
          return requestAuthorizationCodeUrl(request);
        },
        validateFunc: async (request, s) => {
          const result = { valid: false };

          if (getEndemicsClaim(request, organisationKey)) {
            result.valid = true;
          }

          return result;
        },
      });
      server.auth.default({ strategy: "session", mode: "required" });
    },
  },
};
