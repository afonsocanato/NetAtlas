import { Router } from 'express';
import { agentController } from '../controllers/agentController.js';
import { agentAuth } from '../middleware/agentAuth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const agentRouter = Router();

agentRouter.post('/report', agentAuth, asyncHandler(agentController.report));
