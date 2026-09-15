import { Router } from 'express';
import { agentController } from '../controllers/agentController.js';
import { agentAuth } from '../middleware/agentAuth.js';

export const agentRouter = Router();

agentRouter.post('/report', agentAuth, agentController.report);
