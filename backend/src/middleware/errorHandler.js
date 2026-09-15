import { logger } from '../utils/logger.js';

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Express 4 doesn't forward rejected promises from async handlers to the
// error middleware on its own — this wrapper does, so a throw/rejection
// anywhere in an async controller reaches errorHandler() instead of
// hanging the request or crashing the process.
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
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
