import { logger } from '../utils/logger.js';

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
}

export function errorHandler(err, req, res, next) {
  const status = err.status ?? 500;
  if (status >= 500) logger.error(err);
  res.status(status).json({
    error: { code: err.code ?? 'INTERNAL_ERROR', message: err.message ?? 'Unexpected error' },
  });
}
