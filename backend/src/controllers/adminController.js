import { secrets } from '../security/secrets.js';

export const adminController = {
  agentKey(req, res) {
    res.json({ agentApiKey: secrets.agentApiKey });
  },
};
