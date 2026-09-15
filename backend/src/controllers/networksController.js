import { networksModel } from '../models/networksModel.js';

export const networksController = {
  async list(req, res) {
    res.json(await networksModel.list());
  },
};
