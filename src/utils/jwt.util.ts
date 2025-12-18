import jwt from 'jsonwebtoken';
import { env } from '../shared/config/env';
import { JWTPayload } from '../types/auth.types';

/**
 * Utilitários para manipulação de JWT
 */
export class JWTUtil {
  /**
   * Gera Access Token
   */
  static generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, env.jwtAccessSecret, {
      expiresIn: env.jwtAccessExpiresIn,
    });
  }

  /**
   * Gera Refresh Token
   */
  static generateRefreshToken(payload: JWTPayload): string {
    return jwt.sign(payload, env.jwtRefreshSecret, {
      expiresIn: env.jwtRefreshExpiresIn,
    });
  }

  /**
   * Verifica e decodifica Access Token
   */
  static verifyAccessToken(token: string): JWTPayload {
    return jwt.verify(token, env.jwtAccessSecret) as JWTPayload;
  }

  /**
   * Verifica e decodifica Refresh Token
   */
  static verifyRefreshToken(token: string): JWTPayload {
    return jwt.verify(token, env.jwtRefreshSecret) as JWTPayload;
  }
}

