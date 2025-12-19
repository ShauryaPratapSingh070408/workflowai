import axios, { AxiosInstance } from 'axios';
import { logger } from './logger.js';

interface OpenRouterConfig {
  apiKey: string;
  httpReferer?: string;
  xTitle?: string;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class OpenRouterClient {
  private client: AxiosInstance;

  constructor(config: OpenRouterConfig) {
    this.client = axios.create({
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...(config.httpReferer && { 'HTTP-Referer': config.httpReferer }),
        ...(config.xTitle && { 'X-Title': config.xTitle }),
      },
    });
  }

  async chat(
    model: string,
    messages: ChatMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
    }
  ): Promise<string> {
    try {
      const response = await this.client.post('/chat/completions', {
        model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048,
        top_p: options?.topP ?? 1,
      });

      return response.data.choices[0].message.content;
    } catch (error: any) {
      logger.error('OpenRouter API error:', error.response?.data || error.message);
      throw new Error(`OpenRouter API failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async chatWithReasoning(
    model: string,
    systemPrompt: string,
    userPrompt: string,
    followUpPrompt?: string
  ): Promise<string> {
    try {
      // Step 1: Initial response
      const firstResponse = await this.client.post('/chat/completions', {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 1,
      });

      const assistantMsg = firstResponse.data.choices[0].message.content;

      // Step 2: Follow-up if provided
      if (followUpPrompt) {
        const secondResponse = await this.client.post('/chat/completions', {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
            { role: 'assistant', content: assistantMsg },
            { role: 'user', content: followUpPrompt },
          ],
          temperature: 0.7,
        });

        return secondResponse.data.choices[0].message.content;
      }

      return assistantMsg;
    } catch (error: any) {
      logger.error('OpenRouter reasoning error:', error.response?.data || error.message);
      throw new Error(`OpenRouter reasoning failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}
