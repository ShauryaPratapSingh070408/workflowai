import axios, { AxiosInstance } from 'axios';
import { logger } from './logger.js';

interface HuggingFaceConfig {
  apiKey: string;
}

export class HuggingFaceClient {
  private client: AxiosInstance;

  constructor(config: HuggingFaceConfig) {
    this.client = axios.create({
      baseURL: 'https://api-inference.huggingface.co',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async generateImages(
    prompt: string,
    options?: {
      negativePrompt?: string;
      numImages?: number;
      guidanceScale?: number;
      steps?: number;
    }
  ): Promise<string[]> {
    try {
      const response = await this.client.post(
        '/models/stabilityai/stable-diffusion-3-medium',
        {
          inputs: prompt,
          parameters: {
            negative_prompt: options?.negativePrompt || '',
            num_inference_steps: options?.steps || 28,
            guidance_scale: options?.guidanceScale || 7.5,
          },
        },
        {
          responseType: 'arraybuffer',
        }
      );

      // Convert to base64
      const base64Image = Buffer.from(response.data).toString('base64');
      return [base64Image];
    } catch (error: any) {
      logger.error('HuggingFace image generation error:', error.response?.data || error.message);
      throw new Error(`HuggingFace API failed: ${error.message}`);
    }
  }
}
