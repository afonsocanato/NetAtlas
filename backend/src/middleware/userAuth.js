import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { secrets } from '../security/secrets.js';
import { ApiError } from './errorHandler.js';

export function userAuth(req, res, next) {
  if (config.authDisabled) return next();

  const header = req.header('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, 'UNAUTHORIZED', 'Login required'));

  try {
    req.user = jwt.verify(token, secrets.jwtSecret);
    next();
  } catch {
    next(new ApiError(401, 'UNAUTHORIZED', 'Invalid or expired session'));
  }
}

export function verifySocketToken(token) {
  if (config.authDisabled) return true;
  if (!token) return false;
  try {
    jwt.verify(token, secrets.jwtSecret);
    return true;
  } catch {
    return false;
  }
}
