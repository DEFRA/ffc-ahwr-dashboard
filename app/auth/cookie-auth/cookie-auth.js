export const clear = (request) => {
  request.cookieAuth.clear();
};

export const setAuthCookie = (request, email, userType) => {
  request.cookieAuth.set({ email, userType });
};
