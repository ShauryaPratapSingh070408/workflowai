import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger.js';
import { executeWorkflow } from '../services/execution-engine.js';

const db = new PrismaClient();

export default async function workflowRoutes(fastify: FastifyInstance) {
  // Create workflow
  fastify.post<{ Body: any }>('/workflows', async (request, reply) => {
    try {
      const { name, description, nodes, connections } = request.body;
      const userId = 'default-user';

      const workflow = await db.workflow.create({
        data: {
          name,
          description,
          createdBy: userId,
          nodes: {
            create: nodes.map((node: any) => ({
              type: node.type,
              kind: node.kind,
              name: node.name,
              positionX: node.position?.x || 0,
              positionY: node.position?.y || 0,
              config: node.config || {},
            })),
          },
          connections: {
            create: connections.map((conn: any) => ({
              sourceNodeId: conn.sourceNodeId,
              sourceOutput: conn.sourceOutput || 'success',
              targetNodeId: conn.targetNodeId,
              targetInput: conn.targetInput || 'in',
            })),
          },
        },
        include: {
          nodes: true,
          connections: true,
        },
      });

      return { success: true, workflow };
    } catch (error) {
      logger.error('Error creating workflow:', error);
      reply.status(400).send({ error: 'Failed to create workflow' });
    }
  });

  // Get workflow
  fastify.get<{ Params: { id: string } }>(
    '/workflows/:id',
    async (request, reply) => {
      const { id } = request.params;

      const workflow = await db.workflow.findUnique({
        where: { id },
        include: {
          nodes: true,
          connections: true,
        },
      });

      if (!workflow) {
        return reply.status(404).send({ error: 'Workflow not found' });
      }

      return workflow;
    }
  );

  // List workflows
  fastify.get('/workflows', async (request, reply) => {
    const workflows = await db.workflow.findMany({
      include: {
        nodes: true,
        connections: true,
        _count: {
          select: { executions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return workflows;
  });

  // Update workflow
  fastify.put<{ Params: { id: string }; Body: any }>(
    '/workflows/:id',
    async (request, reply) => {
      const { id } = request.params;
      const { name, description, nodes, connections } = request.body;

      try {
        // Delete old nodes and connections
        await db.workflowNode.deleteMany({ where: { workflowId: id } });
        await db.workflowConnection.deleteMany({ where: { workflowId: id } });

        // Update workflow
        const workflow = await db.workflow.update({
          where: { id },
          data: {
            name,
            description,
            version: { increment: 1 },
            nodes: {
              create: nodes.map((node: any) => ({
                type: node.type,
                kind: node.kind,
                name: node.name,
                positionX: node.position?.x || 0,
                positionY: node.position?.y || 0,
                config: node.config || {},
              })),
            },
            connections: {
              create: connections.map((conn: any) => ({
                sourceNodeId: conn.sourceNodeId,
                sourceOutput: conn.sourceOutput || 'success',
                targetNodeId: conn.targetNodeId,
                targetInput: conn.targetInput || 'in',
              })),
            },
          },
          include: {
            nodes: true,
            connections: true,
          },
        });

        return { success: true, workflow };
      } catch (error) {
        logger.error('Error updating workflow:', error);
        reply.status(400).send({ error: 'Failed to update workflow' });
      }
    }
  );

  // Execute workflow
  fastify.post<{ Params: { id: string }; Body: any }>(
    '/workflows/:id/execute',
    async (request, reply) => {
      const { id } = request.params;
      const { input } = request.body;
      const userId = 'default-user';

      try {
        const workflow = await db.workflow.findUnique({
          where: { id },
          include: { nodes: true, connections: true },
        });

        if (!workflow) {
          return reply.status(404).send({ error: 'Workflow not found' });
        }

        // Create execution record
        const execution = await db.execution.create({
          data: {
            workflowId: id,
            createdBy: userId,
            status: 'running',
            trigger: 'manual',
          },
        });

        // Execute async
        executeWorkflow(id, execution.id, input).catch((error) => {
          logger.error('Workflow execution error:', error);
        });

        return {
          success: true,
          execution: { id: execution.id, status: execution.status },
        };
      } catch (error) {
        logger.error('Error starting execution:', error);
        reply.status(500).send({ error: 'Failed to execute workflow' });
      }
    }
  );

  // Delete workflow
  fastify.delete<{ Params: { id: string } }>(
    '/workflows/:id',
    async (request, reply) => {
      const { id } = request.params;

      await db.workflow.delete({ where: { id } });

      return { success: true };
    }
  );
}
