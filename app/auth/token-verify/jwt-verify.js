import jwt from "jsonwebtoken";
import jwktopem from "jwk-to-pem";
import { acquireSigningKey } from "./acquire-signing-key.js";

export const jwtVerify = async (token) => {
  const jwk = await acquireSigningKey();
  const publicKey = jwktopem(jwk);
  const decoded = await jwt.verify(token, publicKey, {
    algorithms: ["RS256"],
    ignoreNotBefore: true,
  });
  if (!decoded) {
    throw new Error("The token has not been verified");
  }
};
