import { networksModel } from '../models/networksModel.js';
import { clientIp } from '../utils/clientIp.js';

// Resolves which network a dashboard visitor should see. Defaults to
// matching the visitor's own public IP against whichever network an agent
// has most recently reported from that same IP — so opening the dashboard
// from a given home/location automatically shows that location's devices,
// no picker needed for the common single-network case. An explicit
// `?networkId=` (from the dashboard's manual network switcher — for
// checking a network you're not currently on, e.g. home from mobile data)
// always wins over the IP guess.
export async function networkContext(req, res, next) {
  try {
    if (req.query.networkId) {
      req.networkId = String(req.query.networkId);
      return next();
    }
    const ip = clientIp(req);
    req.networkId = (await networksModel.findByPublicIp(ip)) ?? 'default';
    next();
  } catch (err) {
    next(err);
  }
}
