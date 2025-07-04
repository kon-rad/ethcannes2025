import Together from "together-ai";

const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY,
});

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ChatCompletionResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class TogetherAIService {
  private static instance: TogetherAIService;
  private together: Together;

  private constructor() {
    this.together = new Together({
      apiKey: process.env.TOGETHER_API_KEY,
    });
  }

  public static getInstance(): TogetherAIService {
    if (!TogetherAIService.instance) {
      TogetherAIService.instance = new TogetherAIService();
    }
    return TogetherAIService.instance;
  }

  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const response = await this.together.chat.completions.create({
        messages: request.messages,
        model: request.model || "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7,
      });

      return {
        content: response.choices[0].message.content || "",
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      console.error("Together AI API error:", error);
      throw new Error("Failed to generate AI response");
    }
  }

  async generateCharacterResponse(
    systemPrompt: string,
    userMessage: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: userMessage }
    ];

    const response = await this.createChatCompletion({
      messages,
      temperature: 0.8, // Slightly higher temperature for more creative responses
    });

    return response.content;
  }
}

// Export a singleton instance
export const togetherAIService = TogetherAIService.getInstance(); 