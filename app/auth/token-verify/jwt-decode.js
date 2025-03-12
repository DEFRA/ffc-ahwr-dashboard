import jwt from "jsonwebtoken";

export const decodeJwt = (token) => {
  const decodedJWT = jwt.decode(token, { complete: true });
  if (decodedJWT === null) {
    throw new Error("The token has not been decoded");
  }
  return decodedJWT.payload;
};
