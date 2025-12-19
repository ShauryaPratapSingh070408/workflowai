import { FastifyInstance } from 'fastify';
import { apiKeyService } from '../services/api-key-service.js';
import { z } from 'zod';

const SaveApiKeySchema = z.object({
  provider: z.enum(['openrouter', 'nvidia', 'huggingface']),
  keyValue: z.string().min(10),
  name: z.string().optional(),
});

export default async function apiKeyRoutes(fastify: FastifyInstance) {
  // Get all API keys for user (without values)
  fastify.get('/api-keys', async (request, reply) => {
    try {
      // TODO: Get userId from JWT token
      const userId = 'default-user'; // Temporary

      const apiKeys = await apiKeyService.listApiKeys(userId);
      return { success: true, apiKeys };
    } catch (error) {
      reply.status(500).send({ error: 'Failed to fetch API keys' });
    }
  });

  // Save or update API key
  fastify.post<{ Body: any }>('/api-keys', async (request, reply) => {
    try {
      const { provider, keyValue, name } = SaveApiKeySchema.parse(request.body);

      // TODO: Get userId from JWT token
      const userId = 'default-user'; // Temporary

      await apiKeyService.saveApiKey(userId, provider, keyValue, name);

      return { 
        success: true, 
        message: `${provider} API key saved successfully`,
        provider 
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.status(400).send({ error: 'Invalid request data', details: error.errors });
      } else {
        reply.status(500).send({ error: 'Failed to save API key' });
      }
    }
  });

  // Delete API key
  fastify.delete<{ Params: { provider: string } }>(
    '/api-keys/:provider',
    async (request, reply) => {
      try {
        const { provider } = request.params;

        // TODO: Get userId from JWT token
        const userId = 'default-user'; // Temporary

        await apiKeyService.deleteApiKey(userId, provider);

        return { success: true, message: 'API key deleted' };
      } catch (error) {
        reply.status(500).send({ error: 'Failed to delete API key' });
      }
    }
  );

  // Toggle API key status
  fastify.patch<{ Params: { provider: string }; Body: { isActive: boolean } }>(
    '/api-keys/:provider/toggle',
    async (request, reply) => {
      try {
        const { provider } = request.params;
        const { isActive } = request.body;

        // TODO: Get userId from JWT token
        const userId = 'default-user'; // Temporary

        await apiKeyService.toggleApiKey(userId, provider, isActive);

        return { success: true, message: `API key ${isActive ? 'activated' : 'deactivated'}` };
      } catch (error) {
        reply.status(500).send({ error: 'Failed to toggle API key' });
      }
    }
  );
}
