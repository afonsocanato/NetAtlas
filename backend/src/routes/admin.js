import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { userAuth } from '../middleware/userAuth.js';

export const adminRouter = Router();

adminRouter.get('/agent-key', userAuth, adminController.agentKey);
