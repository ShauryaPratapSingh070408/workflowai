import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger.js';

const db = new PrismaClient();

export default async function executionRoutes(fastify: FastifyInstance) {
  // Get execution details
  fastify.get<{ Params: { id: string } }>(
    '/executions/:id',
    async (request, reply) => {
      const { id } = request.params;

      const execution = await db.execution.findUnique({
        where: { id },
        include: {
          nodeExecutions: {
            orderBy: { createdAt: 'asc' },
          },
          workflow: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!execution) {
        return reply.status(404).send({ error: 'Execution not found' });
      }

      return execution;
    }
  );

  // List executions
  fastify.get('/executions', async (request, reply) => {
    const executions = await db.execution.findMany({
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { nodeExecutions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return executions;
  });

  // Cancel execution
  fastify.post<{ Params: { id: string } }>(
    '/executions/:id/cancel',
    async (request, reply) => {
      const { id } = request.params;

      const execution = await db.execution.update({
        where: { id },
        data: { status: 'cancelled', finishedAt: new Date() },
      });

      return { success: true, execution };
    }
  );

  // Delete execution
  fastify.delete<{ Params: { id: string } }>(
    '/executions/:id',
    async (request, reply) => {
      const { id } = request.params;

      await db.execution.delete({ where: { id } });

      return { success: true };
    }
  );
}
