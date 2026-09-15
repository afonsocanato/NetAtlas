import { Router } from 'express';
import { deviceController } from '../controllers/deviceController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const devicesRouter = Router();

devicesRouter.get('/', asyncHandler(deviceController.list));
devicesRouter.get('/:id', asyncHandler(deviceController.get));
devicesRouter.patch('/:id', asyncHandler(deviceController.update));
devicesRouter.delete('/:id', asyncHandler(deviceController.remove));
