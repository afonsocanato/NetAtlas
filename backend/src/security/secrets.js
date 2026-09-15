import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';
import { settingsModel } from '../models/settingsModel.js';
import { logger } from '../utils/logger.js';

function randomHex(bytes) {
  return crypto.randomBytes(bytes).toString('hex');
}

const key = (name) => `${config.settingsKeyPrefix}${name}`;

async function resolveAgentApiKey() {
  if (config.agentApiKey) {
    await settingsModel.set(key('agent_api_key'), config.agentApiKey);
    return config.agentApiKey;
  }
  let apiKey = await settingsModel.get(key('agent_api_key'));
  if (!apiKey) {
    apiKey = randomHex(24);
    await settingsModel.set(key('agent_api_key'), apiKey);
    logger.info(`Generated agent API key (no AGENT_API_KEY set): ${apiKey}`);
    logger.info('Paste it into the agent config, or view it anytime from the dashboard once logged in.');
  }
  return apiKey;
}

async function resolveJwtSecret() {
  if (config.jwtSecret) return config.jwtSecret;
  let secret = await settingsModel.get(key('jwt_secret'));
  if (!secret) {
    secret = randomHex(32);
    await settingsModel.set(key('jwt_secret'), secret);
  }
  return secret;
}

async function resolveAdmin() {
  const username = config.adminUsername || (await settingsModel.get(key('admin_username'))) || 'admin';

  if (config.adminPassword) {
    const passwordHash = bcrypt.hashSync(config.adminPassword, 10);
    await settingsModel.set(key('admin_username'), username);
    await settingsModel.set(key('admin_password_hash'), passwordHash);
    return { username, passwordHash };
  }

  let passwordHash = await settingsModel.get(key('admin_password_hash'));
  if (!passwordHash) {
    const generatedPassword = randomHex(9);
    passwordHash = bcrypt.hashSync(generatedPassword, 10);
    await settingsModel.set(key('admin_username'), username);
    await settingsModel.set(key('admin_password_hash'), passwordHash);
    logger.info('============================================================');
    logger.info('No ADMIN_USERNAME/ADMIN_PASSWORD set — generated a login:');
    logger.info(`  username: ${username}`);
    logger.info(`  password: ${generatedPassword}`);
    logger.info('Shown only this once. Set ADMIN_USERNAME/ADMIN_PASSWORD in .env to pin it.');
    logger.info('============================================================');
  }
  return { username, passwordHash };
}

// Mutable, populated once by initSecrets() at server startup and read by
// value thereafter (agentAuth/userAuth/authController import this same
// object and read its properties at request time, not at import time).
export const secrets = {
  agentApiKey: null,
  jwtSecret: null,
  adminUsername: null,
  adminPasswordHash: null,
};

let initialized = false;

export async function initSecrets() {
  if (initialized) return secrets;
  const [agentApiKey, jwtSecret, admin] = await Promise.all([resolveAgentApiKey(), resolveJwtSecret(), resolveAdmin()]);
  Object.assign(secrets, { agentApiKey, jwtSecret, adminUsername: admin.username, adminPasswordHash: admin.passwordHash });
  initialized = true;
  return secrets;
}
