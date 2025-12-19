import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { encryptApiKey, decryptApiKey } from '../lib/encryption.js';
import { logger } from '../lib/logger.js';

const db = new PrismaClient();

export default async function settingsRoutes(fastify: FastifyInstance) {
  // Get all settings for user
  fastify.get('/settings', async (request, reply) => {
    try {
      // TODO: Get userId from authentication
      const userId = 'default-user'; // Temporary hardcoded user

      const settings = await db.settings.findMany({
        where: { userId },
        select: {
          id: true,
          key: true,
          createdAt: true,
          updatedAt: true,
          // Don't return the actual value for security
        },
      });

      // Add masked values for display
      const settingsWithMasked = settings.map((setting) => ({
        ...setting,
        value: '••••••••', // Masked for security
        isConfigured: true,
      }));

      return settingsWithMasked;
    } catch (error) {
      logger.error('Error fetching settings:', error);
      reply.status(500).send({ error: 'Failed to fetch settings' });
    }
  });

  // Update or create a setting
  fastify.post<{ Body: { key: string; value: string } }>(
    '/settings',
    async (request, reply) => {
      try {
        const { key, value } = request.body;
        const userId = 'default-user'; // Temporary hardcoded user

        if (!key || !value) {
          return reply.status(400).send({ error: 'Key and value are required' });
        }

        // Validate key is one of the allowed API keys
        const allowedKeys = [
          'OPENROUTER_API_KEY',
          'NVIDIA_API_KEY',
          'HUGGINGFACE_API_KEY',
        ];

        if (!allowedKeys.includes(key)) {
          return reply.status(400).send({ error: 'Invalid setting key' });
        }

        // Encrypt the API key
        const encryptedValue = encryptApiKey(value);

        // Upsert setting
        const setting = await db.settings.upsert({
          where: {
            userId_key: {
              userId,
              key,
            },
          },
          update: {
            value: encryptedValue,
            updatedAt: new Date(),
          },
          create: {
            userId,
            key,
            value: encryptedValue,
          },
        });

        logger.info(`Setting ${key} updated for user ${userId}`);

        return {
          success: true,
          message: `${key} updated successfully`,
          setting: {
            id: setting.id,
            key: setting.key,
            isConfigured: true,
          },
        };
      } catch (error) {
        logger.error('Error updating setting:', error);
        reply.status(500).send({ error: 'Failed to update setting' });
      }
    }
  );

  // Delete a setting
  fastify.delete<{ Params: { key: string } }>(
    '/settings/:key',
    async (request, reply) => {
      try {
        const { key } = request.params;
        const userId = 'default-user'; // Temporary hardcoded user

        await db.settings.delete({
          where: {
            userId_key: {
              userId,
              key,
            },
          },
        });

        logger.info(`Setting ${key} deleted for user ${userId}`);

        return { success: true, message: `${key} deleted successfully` };
      } catch (error) {
        logger.error('Error deleting setting:', error);
        reply.status(500).send({ error: 'Failed to delete setting' });
      }
    }
  );

  // Get decrypted API key (internal use only)
  fastify.get<{ Params: { key: string } }>(
    '/settings/:key/decrypt',
    async (request, reply) => {
      try {
        const { key } = request.params;
        const userId = 'default-user'; // Temporary hardcoded user

        const setting = await db.settings.findUnique({
          where: {
            userId_key: {
              userId,
              key,
            },
          },
        });

        if (!setting) {
          return reply.status(404).send({ error: 'Setting not found' });
        }

        const decryptedValue = decryptApiKey(setting.value);

        return {
          key: setting.key,
          value: decryptedValue,
        };
      } catch (error) {
        logger.error('Error decrypting setting:', error);
        reply.status(500).send({ error: 'Failed to decrypt setting' });
      }
    }
  );
}
