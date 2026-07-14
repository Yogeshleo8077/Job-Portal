import jwt, { SignOptions } from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env';

export interface JwtPayload {
  sub: string; // user id
  role: Role;
  email: string;
}

export const signAccessToken = (payload: JwtPayload): string =>
  jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  } as SignOptions);

export const signRefreshToken = (payload: JwtPayload): string =>
  jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  } as SignOptions);

export const verifyAccessToken = (token: string): JwtPayload =>
  jwt.verify(token, env.jwt.accessSecret) as JwtPayload;

export const verifyRefreshToken = (token: string): JwtPayload =>
  jwt.verify(token, env.jwt.refreshSecret) as JwtPayload;
