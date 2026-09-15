import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { userAuth } from '../middleware/userAuth.js';

export const authRouter = Router();

authRouter.post('/login', authController.login);
authRouter.get('/me', userAuth, authController.me);
