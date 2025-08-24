import {
  clearAllOfSession,
  getToken,
} from "../session/index.js";
import { clearAuthCookie } from "../auth/cookie-auth/cookie-auth.js";
import { authConfig } from "../config/auth.js";
import { claimServiceUri } from "../config/routes.js";
import { sessionKeys } from "../session/keys.js";

function getSignOutUrl(token) {
  const signOutUrl = `${authConfig.defraId.hostname}/${authConfig.defraId.policy}/oauth2/v2.0/logout`;

  const query = [
    `post_logout_redirect_uri=${claimServiceUri}`,
    `id_token_hint=${token}`,
  ].join("&");

  return encodeURI(`${signOutUrl}?${query}`);
}

export const signOutHandlers = [
  {
    method: "GET",
    path: "/sign-out",
    options: {
      handler: async (request, h) => {
        const token = getToken(request, sessionKeys.tokens.accessToken);
        clearAllOfSession(request);
        clearAuthCookie(request);

        return h.redirect(getSignOutUrl(token));
      },
    },
  },
];
