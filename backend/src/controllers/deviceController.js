import { deviceModel } from '../models/deviceModel.js';
import { emitDeviceUpdated } from '../sockets/index.js';
import { ApiError } from '../middleware/errorHandler.js';

export const deviceController = {
  list(req, res) {
    const { status, vendor, deviceType, q } = req.query;
    res.json(deviceModel.findAll({ status, vendor, deviceType, q }));
  },

  get(req, res, next) {
    const device = deviceModel.findById(Number(req.params.id));
    if (!device) return next(new ApiError(404, 'DEVICE_NOT_FOUND', 'Device not found'));
    res.json(device);
  },

  update(req, res, next) {
    const id = Number(req.params.id);
    const existing = deviceModel.findById(id);
    if (!existing) return next(new ApiError(404, 'DEVICE_NOT_FOUND', 'Device not found'));

    const { customLabel, deviceType } = req.body;
    const device = deviceModel.update(id, { customLabel, deviceType });
    emitDeviceUpdated(device);
    res.json(device);
  },

  remove(req, res, next) {
    const id = Number(req.params.id);
    const existing = deviceModel.findById(id);
    if (!existing) return next(new ApiError(404, 'DEVICE_NOT_FOUND', 'Device not found'));
    deviceModel.remove(id);
    res.status(204).end();
  },

  summary(req, res) {
    res.json(deviceModel.summary());
  },
};
