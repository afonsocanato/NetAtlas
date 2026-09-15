import { deviceService } from '../services/deviceService.js';
import { ApiError } from '../middleware/errorHandler.js';

export const agentController = {
  report(req, res, next) {
    const { devices } = req.body;
    if (!Array.isArray(devices)) {
      return next(new ApiError(400, 'INVALID_PAYLOAD', '"devices" must be an array'));
    }
    const result = deviceService.ingestReport(req.body);
    res.status(202).json(result);
  },
};
