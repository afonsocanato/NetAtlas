import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { secrets } from '../security/secrets.js';
import { ApiError } from '../middleware/errorHandler.js';

const SESSION_DURATION = '30d';

export const authController = {
  login(req, res, next) {
    const { username, password } = req.body;
    if (!username || !password) {
      return next(new ApiError(400, 'INVALID_PAYLOAD', 'username and password are required'));
    }

    const validUsername = username === secrets.adminUsername;
    const validPassword = bcrypt.compareSync(password, secrets.adminPasswordHash);
    if (!validUsername || !validPassword) {
      return next(new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid username or password'));
    }

    const token = jwt.sign({ sub: username }, secrets.jwtSecret, { expiresIn: SESSION_DURATION });
    res.json({ token, username });
  },

  me(req, res) {
    res.json({ username: req.user?.sub ?? secrets.adminUsername });
  },
};
