import { deviceModel } from '../models/deviceModel.js';
import { emitDeviceUpdated } from '../sockets/index.js';
import { ApiError } from '../middleware/errorHandler.js';

export const deviceController = {
  async list(req, res) {
    const { status, vendor, deviceType, q } = req.query;
    res.json(await deviceModel.findAll({ status, vendor, deviceType, q, networkId: req.networkId }));
  },

  async get(req, res, next) {
    const device = await deviceModel.findById(Number(req.params.id));
    if (!device) return next(new ApiError(404, 'DEVICE_NOT_FOUND', 'Device not found'));
    res.json(device);
  },

  async update(req, res, next) {
    const id = Number(req.params.id);
    const existing = await deviceModel.findById(id);
    if (!existing) return next(new ApiError(404, 'DEVICE_NOT_FOUND', 'Device not found'));

    const { customLabel, deviceType } = req.body;
    const device = await deviceModel.update(id, { customLabel, deviceType });
    emitDeviceUpdated(device);
    res.json(device);
  },

  async remove(req, res, next) {
    const id = Number(req.params.id);
    const existing = await deviceModel.findById(id);
    if (!existing) return next(new ApiError(404, 'DEVICE_NOT_FOUND', 'Device not found'));
    await deviceModel.remove(id);
    res.status(204).end();
  },

  async summary(req, res) {
    res.json(await deviceModel.summary(req.networkId));
  },
};
