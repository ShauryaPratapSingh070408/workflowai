import { PrismaClient } from '@prisma/client';
import { decryptApiKey } from './encryption.js';
import { logger } from './logger.js';

const db = new PrismaClient();

export async function getApiKey(
  key: 'OPENROUTER_API_KEY' | 'NVIDIA_API_KEY' | 'HUGGINGFACE_API_KEY',
  userId: string = 'default-user'
): Promise<string> {
  try {
    const setting = await db.settings.findUnique({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
    });

    if (!setting) {
      throw new Error(`API key ${key} not configured. Please add it in Settings.`);
    }

    return decryptApiKey(setting.value);
  } catch (error) {
    logger.error(`Error fetching API key ${key}:`, error);
    throw error;
  }
}

export async function hasApiKey(
  key: 'OPENROUTER_API_KEY' | 'NVIDIA_API_KEY' | 'HUGGINGFACE_API_KEY',
  userId: string = 'default-user'
): Promise<boolean> {
  try {
    const setting = await db.settings.findUnique({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
    });

    return !!setting;
  } catch (error) {
    return false;
  }
}
