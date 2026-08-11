import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";

export const jwtUtils = {
  sign: (payload: object, secret: string, options?: SignOptions) => {
    return jwt.sign(payload, secret, options);
  },
  verify: (token: string, secret: string): string | JwtPayload => {
    return jwt.verify(token, secret);
  },
};
