import { config } from '../config/index.js';
import { ApiError } from './errorHandler.js';

export function agentAuth(req, res, next) {
  const key = req.header('X-Api-Key');
  if (!key || key !== config.agentApiKey) {
    return next(new ApiError(401, 'UNAUTHORIZED', 'Missing or invalid agent API key'));
  }
  next();
}
