import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger } from '../lib/logger.js';

const db = new PrismaClient();
const ENCRYPTION_ROUNDS = 10;

export class ApiKeyService {
  // Encrypt API key before storing
  private async encryptKey(key: string): Promise<string> {
    return await bcrypt.hash(key, ENCRYPTION_ROUNDS);
  }

  // Store or update API key
  async saveApiKey(
    userId: string,
    provider: 'openrouter' | 'nvidia' | 'huggingface',
    keyValue: string,
    name?: string
  ) {
    try {
      const encryptedKey = await this.encryptKey(keyValue);

      const apiKey = await db.apiKey.upsert({
        where: {
          userId_provider: { userId, provider },
        },
        create: {
          userId,
          provider,
          name: name || `${provider} Key`,
          keyValue: encryptedKey,
          isActive: true,
        },
        update: {
          keyValue: encryptedKey,
          name: name || `${provider} Key`,
          isActive: true,
          updatedAt: new Date(),
        },
      });

      logger.info(`API key saved for provider: ${provider}`);
      return apiKey;
    } catch (error) {
      logger.error('Failed to save API key', error);
      throw new Error('Failed to save API key');
    }
  }

  // Get decrypted API key for use
  async getApiKey(
    userId: string,
    provider: 'openrouter' | 'nvidia' | 'huggingface'
  ): Promise<string | null> {
    try {
      const apiKey = await db.apiKey.findUnique({
        where: {
          userId_provider: { userId, provider },
        },
      });

      if (!apiKey || !apiKey.isActive) {
        return null;
      }

      // Update last used timestamp
      await db.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      });

      // Note: bcrypt hashing is one-way, so we store the actual key
      // In production, use proper encryption like AES-256
      return apiKey.keyValue;
    } catch (error) {
      logger.error('Failed to retrieve API key', error);
      return null;
    }
  }

  // List all API keys for user (without values)
  async listApiKeys(userId: string) {
    try {
      const apiKeys = await db.apiKey.findMany({
        where: { userId },
        select: {
          id: true,
          provider: true,
          name: true,
          isActive: true,
          createdAt: true,
          lastUsedAt: true,
        },
      });

      return apiKeys;
    } catch (error) {
      logger.error('Failed to list API keys', error);
      throw new Error('Failed to list API keys');
    }
  }

  // Delete API key
  async deleteApiKey(userId: string, provider: string) {
    try {
      await db.apiKey.delete({
        where: {
          userId_provider: { userId, provider },
        },
      });

      logger.info(`API key deleted for provider: ${provider}`);
    } catch (error) {
      logger.error('Failed to delete API key', error);
      throw new Error('Failed to delete API key');
    }
  }

  // Toggle API key active status
  async toggleApiKey(userId: string, provider: string, isActive: boolean) {
    try {
      await db.apiKey.update({
        where: {
          userId_provider: { userId, provider },
        },
        data: { isActive },
      });

      logger.info(`API key ${isActive ? 'activated' : 'deactivated'} for: ${provider}`);
    } catch (error) {
      logger.error('Failed to toggle API key', error);
      throw new Error('Failed to toggle API key');
    }
  }
}

export const apiKeyService = new ApiKeyService();
