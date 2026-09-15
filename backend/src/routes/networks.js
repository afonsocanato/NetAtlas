import { Router } from 'express';
import { networksController } from '../controllers/networksController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const networksRouter = Router();

networksRouter.get('/', asyncHandler(networksController.list));
