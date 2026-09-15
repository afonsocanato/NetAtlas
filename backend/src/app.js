import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { devicesRouter } from './routes/devices.js';
import { agentRouter } from './routes/agent.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';
import { deviceController } from './controllers/deviceController.js';
import { userAuth } from './middleware/userAuth.js';
import { networkContext } from './middleware/networkContext.js';
import { notFoundHandler, errorHandler, asyncHandler } from './middleware/errorHandler.js';
import './db/index.js';

export const app = express();

// Behind Caddy + Cloudflare Tunnel; trusts their X-Forwarded-* headers so
// req.ip resolves to the real visitor (clientIp() prefers CF-Connecting-IP
// regardless, but this keeps req.ip itself sane too).
app.set('trust proxy', true);

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/health', healthRouter);
app.use('/api/agent', agentRouter); // own key-based auth, not user login

app.use('/api/devices', userAuth, networkContext, devicesRouter);
app.use('/api/admin', adminRouter);
app.get('/api/network/summary', userAuth, networkContext, asyncHandler(deviceController.summary));

app.use(notFoundHandler);
app.use(errorHandler);
