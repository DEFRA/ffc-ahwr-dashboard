import { parseRoles } from "./parse-roles.js";

export const set = (request, accessToken) => {
  request.cookieAuth.set({
    scope: parseRoles(accessToken.roles),
    account: {
      email: accessToken.email,
      name: `${accessToken.firstName} ${accessToken.lastName}`,
    },
  });
};

export const clear = (request) => {
  request.cookieAuth.clear();
};

export const setAuthCookie = (request, email, userType) => {
  request.cookieAuth.set({ email, userType });
};
