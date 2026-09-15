import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { devicesRouter } from './routes/devices.js';
import { agentRouter } from './routes/agent.js';
import { healthRouter } from './routes/health.js';
import { deviceController } from './controllers/deviceController.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import './db/index.js';

export const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.use('/api/devices', devicesRouter);
app.use('/api/agent', agentRouter);
app.use('/api/health', healthRouter);
app.get('/api/network/summary', deviceController.summary);

app.use(notFoundHandler);
app.use(errorHandler);
