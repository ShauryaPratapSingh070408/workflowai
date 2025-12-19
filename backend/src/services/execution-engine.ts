import { PrismaClient } from '@prisma/client';
import { OpenRouterClient } from '../lib/openrouter.js';
import { NvidiaClient } from '../lib/nvidia.js';
import { HuggingFaceClient } from '../lib/huggingface.js';
import { getApiKey, hasApiKey } from '../lib/settings-helper.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import PptxGenJS from 'pptxgenjs';
import { logger } from '../lib/logger.js';

interface Item {
  json: Record<string, any>;
  binary?: Record<string, any>;
}

const db = new PrismaClient();

export async function executeWorkflow(
  workflowId: string,
  executionId: string,
  triggerInput?: Item[]
) {
  try {
    const workflow = await db.workflow.findUnique({
      where: { id: workflowId },
      include: { nodes: true, connections: true },
    });

    if (!workflow) throw new Error('Workflow not found');

    // Find trigger nodes
    const triggerNodes = workflow.nodes.filter((n) => n.kind === 'trigger');
    if (triggerNodes.length === 0) {
      throw new Error('No trigger node found in workflow');
    }

    // Execute from first trigger
    const items = triggerInput || [{ json: {} }];
    await executeNodes(executionId, workflow, triggerNodes[0], items);

    // Mark as complete
    await db.execution.update({
      where: { id: executionId },
      data: {
        status: 'success',
        finishedAt: new Date(),
      },
    });

    logger.info(`Execution ${executionId} completed successfully`);
  } catch (error: any) {
    logger.error('Execution error:', error);
    await db.execution.update({
      where: { id: executionId },
      data: {
        status: 'error',
        error: {
          message: error.message || 'Unknown error',
        },
        finishedAt: new Date(),
      },
    });
  }
}

async function executeNodes(
  executionId: string,
  workflow: any,
  currentNode: any,
  items: Item[]
): Promise<Item[]> {
  const nodeExecution = await db.nodeExecution.create({
    data: {
      executionId,
      nodeId: currentNode.id,
      status: 'running',
      inputItems: items,
    },
  });

  try {
    let outputItems = items;

    // Execute based on node type
    switch (currentNode.type) {
      case 'manualTrigger':
        outputItems = items;
        break;

      case 'httpRequest':
        outputItems = await executeHttpNode(currentNode, items);
        break;

      case 'htmlExtract':
        outputItems = await executeHtmlExtractNode(currentNode, items);
        break;

      case 'aiText':
        outputItems = await executeAiTextNode(currentNode, items);
        break;

      case 'imageGeneration':
        outputItems = await executeImageGenerationNode(currentNode, items);
        break;

      case 'exportPptx':
        outputItems = await executeExportPptxNode(currentNode, items);
        break;

      case 'forEach':
        outputItems = await executeForEachNode(currentNode, items, executionId, workflow);
        break;

      case 'if':
        outputItems = await executeIfNode(currentNode, items);
        break;

      case 'code':
        outputItems = await executeCodeNode(currentNode, items);
        break;

      default:
        logger.warn(`Unknown node type: ${currentNode.type}`);
        outputItems = items;
    }

    // Update node execution
    await db.nodeExecution.update({
      where: { id: nodeExecution.id },
      data: {
        status: 'success',
        outputItems,
        finishedAt: new Date(),
      },
    });

    // Find and execute next nodes
    const connections = workflow.connections.filter(
      (c: any) => c.sourceNodeId === currentNode.id
    );

    for (const conn of connections) {
      const nextNode = workflow.nodes.find((n: any) => n.id === conn.targetNodeId);
      if (nextNode) {
        await executeNodes(executionId, workflow, nextNode, outputItems);
      }
    }

    return outputItems;
  } catch (error: any) {
    logger.error('Node execution error:', error);

    await db.nodeExecution.update({
      where: { id: nodeExecution.id },
      data: {
        status: 'error',
        error: {
          message: error.message || 'Unknown error',
        },
        finishedAt: new Date(),
      },
    });

    throw error;
  }
}

// HTTP Request Node
async function executeHttpNode(node: any, items: Item[]): Promise<Item[]> {
  const { url, method = 'GET' } = node.config;
  const results: Item[] = [];

  for (const item of items) {
    const interpolatedUrl = interpolateTemplate(url, item.json);
    const response = await axios({
      method,
      url: interpolatedUrl,
      timeout: 30000,
    });

    results.push({
      json: {
        ...item.json,
        statusCode: response.status,
        html: response.data,
        headers: response.headers,
      },
    });
  }

  return results;
}

// HTML Extract Node
async function executeHtmlExtractNode(node: any, items: Item[]): Promise<Item[]> {
  const { selector, attribute = 'text', extractProperty = 'extracted' } = node.config;
  const results: Item[] = [];

  for (const item of items) {
    const html = item.json.html || '';
    const $ = cheerio.load(html);

    let extracted: any;

    if (attribute === 'text') {
      extracted = $(selector).text();
    } else if (attribute === 'html') {
      extracted = $(selector).html();
    } else {
      extracted = $(selector).attr(attribute);
    }

    results.push({
      json: {
        ...item.json,
        [extractProperty]: extracted,
      },
    });
  }

  return results;
}

// AI Text Node
async function executeAiTextNode(node: any, items: Item[]): Promise<Item[]> {
  const {
    provider,
    model,
    systemPrompt,
    userPromptTemplate,
    outputField = 'aiResult',
  } = node.config;

  // Check if API key is configured
  const apiKeyName = provider === 'openrouter' ? 'OPENROUTER_API_KEY' : 'NVIDIA_API_KEY';
  const hasKey = await hasApiKey(apiKeyName as any);

  if (!hasKey) {
    throw new Error(`${apiKeyName} not configured. Please add it in Settings page.`);
  }

  const apiKey = await getApiKey(apiKeyName as any);
  const results: Item[] = [];

  for (const item of items) {
    const userPrompt = interpolateTemplate(userPromptTemplate, item.json);

    let aiResult: string;

    if (provider === 'openrouter') {
      const client = new OpenRouterClient({ apiKey });
      aiResult = await client.chat(model, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);
    } else if (provider === 'nvidia') {
      const client = new NvidiaClient({ apiKey });
      aiResult = await client.chatWithReasoning(model, systemPrompt, userPrompt);
    } else {
      throw new Error(`Unknown AI provider: ${provider}`);
    }

    results.push({
      json: {
        ...item.json,
        [outputField]: aiResult,
      },
    });
  }

  return results;
}

// Image Generation Node
async function executeImageGenerationNode(node: any, items: Item[]): Promise<Item[]> {
  const { promptTemplate, outputField = 'generatedImages' } = node.config;

  const hasKey = await hasApiKey('HUGGINGFACE_API_KEY');
  if (!hasKey) {
    throw new Error('HUGGINGFACE_API_KEY not configured. Please add it in Settings page.');
  }

  const apiKey = await getApiKey('HUGGINGFACE_API_KEY');
  const client = new HuggingFaceClient({ apiKey });
  const results: Item[] = [];

  for (const item of items) {
    const prompt = interpolateTemplate(promptTemplate, item.json);
    const images = await client.generateImages(prompt);

    results.push({
      json: {
        ...item.json,
        [outputField]: images,
      },
    });
  }

  return results;
}

// Export PPTX Node
async function executeExportPptxNode(node: any, items: Item[]): Promise<Item[]> {
  const prs = new PptxGenJS();

  for (const item of items) {
    const { title, slides } = item.json;

    // Title slide
    const titleSlide = prs.addSlide();
    titleSlide.addText(title || 'Presentation', {
      x: 0.5,
      y: 2,
      w: 9,
      h: 1.5,
      fontSize: 44,
      bold: true,
    });

    // Content slides
    if (slides && Array.isArray(slides)) {
      for (const slide of slides) {
        const contentSlide = prs.addSlide();
        contentSlide.addText(slide.title || '', {
          x: 0.5,
          y: 0.5,
          w: 9,
          h: 0.75,
          fontSize: 32,
          bold: true,
        });

        const content = slide.bullets?.join('\n') || slide.content || '';
        contentSlide.addText(content, {
          x: 1,
          y: 1.5,
          w: 8.5,
          h: 4,
          fontSize: 18,
        });
      }
    }

    const fileName = `export_${Date.now()}.pptx`;
    const path = `./exports/${fileName}`;

    await prs.writeFile({ fileName: path });

    return [
      {
        json: {
          ...item.json,
          pptxPath: path,
          pptxFile: fileName,
        },
      },
    ];
  }

  return items;
}

// ForEach Node
async function executeForEachNode(
  node: any,
  items: Item[],
  executionId: string,
  workflow: any
): Promise<Item[]> {
  const { arrayPath } = node.config;
  const results: Item[] = [];

  for (const item of items) {
    const array = getNestedValue(item.json, arrayPath);

    if (Array.isArray(array)) {
      for (const element of array) {
        results.push({
          json: element,
        });
      }
    }
  }

  return results;
}

// IF Node
async function executeIfNode(node: any, items: Item[]): Promise<Item[]> {
  const { expression } = node.config;
  const results: Item[] = [];

  for (const item of items) {
    const condition = evaluateExpression(expression, item.json);

    if (condition) {
      results.push(item);
    }
  }

  return results;
}

// Code Execution Node
async function executeCodeNode(node: any, items: Item[]): Promise<Item[]> {
  const { code } = node.config;
  const results: Item[] = [];

  for (const item of items) {
    try {
      // Simple eval - in production use vm2 or isolated-vm for safety
      const fn = new Function('item', code);
      const result = fn(item.json);

      results.push({
        json: result || item.json,
      });
    } catch (error: any) {
      logger.error('Code execution error:', error);
      results.push(item); // Pass through on error
    }
  }

  return results;
}

// Helper functions
function interpolateTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return data[key] || `{{${key}}}`;
  });
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function evaluateExpression(expression: string, data: Record<string, any>): boolean {
  try {
    // Simple evaluation - in production use safer alternatives
    const fn = new Function(...Object.keys(data), `return ${expression}`);
    return fn(...Object.values(data));
  } catch (error) {
    logger.error('Expression evaluation error:', error);
    return false;
  }
}
