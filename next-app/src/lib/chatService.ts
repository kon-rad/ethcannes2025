import { TogetherAiService, ChatMessage } from '../services/togetherAiService';
import { TOGETHER_AI_MODELS } from '../utils/aiModels';

export class ChatService {
  private togetherService: TogetherAiService;

  constructor() {
    this.togetherService = new TogetherAiService();
  }

  async generateCharacterResponse(
    systemPrompt: string,
    userMessage: string,
    conversationHistory: ChatMessage[] = [],
    modelKey: string = 'LLAMA_3_1_8B_INSTRUCT_TURBO'
  ): Promise<string> {
    try {
      const model = TOGETHER_AI_MODELS[modelKey]?.apiModelString || TOGETHER_AI_MODELS.LLAMA_3_1_8B_INSTRUCT_TURBO.apiModelString;
      
      const messages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: userMessage }
      ];

      const response = await this.togetherService.createChatCompletion({
        model,
        messages,
        stream: false,
        temperature: 0.8, // Slightly higher temperature for more creative responses
        max_tokens: 1000,
      });

      if (response && response.choices && response.choices[0]?.message?.content) {
        return response.choices[0].message.content;
      } else {
        throw new Error('No response generated from AI');
      }
    } catch (error) {
      console.error('Chat service error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async generateStreamingResponse(
    systemPrompt: string,
    userMessage: string,
    conversationHistory: ChatMessage[] = [],
    modelKey: string = 'LLAMA_3_1_8B_INSTRUCT_TURBO'
  ) {
    try {
      const model = TOGETHER_AI_MODELS[modelKey]?.apiModelString || TOGETHER_AI_MODELS.LLAMA_3_1_8B_INSTRUCT_TURBO.apiModelString;
      
      const messages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: userMessage }
      ];

      return await this.togetherService.createChatCompletion({
        model,
        messages,
        stream: true,
        temperature: 0.8,
        max_tokens: 1000,
      });
    } catch (error) {
      console.error('Streaming chat service error:', error);
      throw new Error('Failed to generate streaming AI response');
    }
  }

  getAvailableModels() {
    return Object.keys(TOGETHER_AI_MODELS).map(key => ({
      key,
      ...TOGETHER_AI_MODELS[key]
    }));
  }
}

// Export a singleton instance
export const chatService = new ChatService(); 