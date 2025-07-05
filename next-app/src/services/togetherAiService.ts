import Together from 'together-ai';
import { Stream } from 'together-ai/streaming';
import { ChatCompletionChunk } from 'together-ai/resources/chat/completions';

export type MessageRole = "user" | "system" | "assistant" | "tool";

export interface ChatMessage {
  role: MessageRole;
  content: string;
}

export class TogetherAiService {
  private client: Together;

  constructor() {
    console.log(process.env.TOGETHER_API_KEY);
    if (!process.env.TOGETHER_API_KEY) {
      console.error('TOGETHER_API_KEY is not set in environment variables');
      console.error('Please create a .env.local file in the next-app directory with:');
      console.error('TOGETHER_API_KEY=your_api_key_here');
      console.error('Get your API key from: https://together.ai');
      throw new Error('TOGETHER_API_KEY is not set in environment variables. Please check the console for setup instructions.');
    }
    this.client = new Together({ apiKey: process.env.TOGETHER_API_KEY });
  }

  async createChatCompletion({
    model,
    messages,
    stream = false,
    temperature = 0.7,
    max_tokens = 1000
  }: {
    model: string;
    messages: Array<ChatMessage>;
    stream?: boolean;
    temperature?: number;
    max_tokens?: number;
  }): Promise<Stream<ChatCompletionChunk> | any> {
    try {
      // Log input parameters
      console.log('TogetherAI Service - Input Parameters:', {
        model,
        stream,
        temperature,
        max_tokens
      });

      // Convert messages to the correct format
      const validatedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })) as any;

      if (stream) {
        const response = await this.client.chat.completions.create({
          model,
          messages: validatedMessages,
          stream: true,
          temperature,
          max_tokens,
        });

        return response as Stream<ChatCompletionChunk>;
      } else {
        const response = await this.client.chat.completions.create({
          model,
          messages: validatedMessages,
          stream: false,
          temperature,
          max_tokens,
        });

        return response;
      }
    } catch (error: unknown) {
      console.error('Together AI Chat Error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  async generateVisionResponse(prompt: string, imageUrl: string, model: string = 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo') {
    try {
      const response = await this.client.chat.completions.create({
        model,
        temperature: 0.2,
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
            ] as any, // Cast to any to satisfy TypeScript
          },
        ],
        stream: false,
      });

      return response.choices[0]?.message?.content || null;
    } catch (error: unknown) {
      console.error('Together AI Vision Error:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  async generateVisionResponseFromBase64(
    prompt: string, 
    base64Image: string, 
    model: string = 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo'
  ) {
    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ] as any, // Cast to any to satisfy TypeScript
          },
        ],
        stream: false,
      });

      return response.choices[0]?.message?.content || null;
    } catch (error: unknown) {
      console.error('Together AI Vision Error:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }
} 