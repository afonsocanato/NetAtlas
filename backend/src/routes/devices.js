import { Router } from 'express';
import { deviceController } from '../controllers/deviceController.js';

export const devicesRouter = Router();

devicesRouter.get('/', deviceController.list);
devicesRouter.get('/:id', deviceController.get);
devicesRouter.patch('/:id', deviceController.update);
devicesRouter.delete('/:id', deviceController.remove);
