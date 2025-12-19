import { OpenAI } from 'openai';
import { logger } from './logger.js';

interface NvidiaConfig {
  apiKey: string;
}

export class NvidiaClient {
  private client: OpenAI;

  constructor(config: NvidiaConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });
  }

  async chatWithReasoning(
    model: string,
    systemPrompt: string,
    userPrompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      thinkingBudget?: number;
    }
  ): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: options?.temperature ?? 1.1,
        max_tokens: options?.maxTokens ?? 4096,
        top_p: 0.95,
      } as any);

      return response.choices[0].message.content || '';
    } catch (error: any) {
      logger.error('NVIDIA NIM error:', error);
      throw new Error(`NVIDIA NIM API failed: ${error.message}`);
    }
  }
}
