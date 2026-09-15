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
import { notFoundHandler, errorHandler, asyncHandler } from './middleware/errorHandler.js';
import './db/index.js';

export const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/health', healthRouter);
app.use('/api/agent', agentRouter); // own key-based auth, not user login

app.use('/api/devices', userAuth, devicesRouter);
app.use('/api/admin', adminRouter);
app.get('/api/network/summary', userAuth, asyncHandler(deviceController.summary));

app.use(notFoundHandler);
app.use(errorHandler);
