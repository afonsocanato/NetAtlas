import { deviceService } from '../services/deviceService.js';
import { ApiError } from '../middleware/errorHandler.js';
import { clientIp } from '../utils/clientIp.js';

export const agentController = {
  async report(req, res, next) {
    const { devices } = req.body;
    if (!Array.isArray(devices)) {
      return next(new ApiError(400, 'INVALID_PAYLOAD', '"devices" must be an array'));
    }
    const result = await deviceService.ingestReport(req.body, clientIp(req));
    res.status(202).json(result);
  },
};
