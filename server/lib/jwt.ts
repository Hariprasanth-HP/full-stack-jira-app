import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

// ---- Types ----
export interface TokenPayload extends JwtPayload {
  userId: number;
  [key: string]: any;
}

// ---- Access Token ----
export function signAccessToken(
  payload: TokenPayload,
  secret: string,
  expiresIn: any = "1h"
): string {
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, secret, options);
}

// ---- Refresh Token ----
export function signRefreshToken(
  payload: TokenPayload,
  secret: string,
  expiresIn: any = "7d"
): string {
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, secret, options);
}

// ---- Verify any token ----
export function verifyToken<T extends object = TokenPayload>(
  token: string,
  secret: string
): T {
  try {
    return jwt.verify(token, secret) as T;
  } catch (err) {
    throw new Error("Invalid or expired token");
  }
}

// ---- Decode without verifying ----
export function decodeToken(token: string): null | JwtPayload | string {
  return jwt.decode(token);
}
