import { networksModel } from '../models/networksModel.js';
import { clientIp } from '../utils/clientIp.js';

// Resolves which network a dashboard visitor should see: matches the
// visitor's own public IP against whichever network(s) an agent has most
// recently reported from that same IP — so opening the dashboard from a
// given home/location automatically shows that location's devices, with no
// manual network picker. Falls back to "default" when nothing matches yet
// (e.g. no agent has reported from this IP), so the dashboard never just
// shows an unexplained empty screen for the common single-network case.
export async function networkContext(req, res, next) {
  try {
    const ip = clientIp(req);
    req.networkId = (await networksModel.findByPublicIp(ip)) ?? 'default';
    next();
  } catch (err) {
    next(err);
  }
}
