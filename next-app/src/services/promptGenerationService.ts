import Together from 'together-ai';

export interface PromptGenerationRequest {
  characterName: string;
  characterDescription: string;
  systemPrompt: string;
  postType?: 'social' | 'professional' | 'casual' | 'creative';
}

export interface PromptGenerationResponse {
  imagePrompt: string;
  postTitle?: string;
  postDescription?: string;
}

export class PromptGenerationService {
  private client: Together;

  constructor() {
    if (!process.env.TOGETHER_API_KEY) {
      throw new Error('TOGETHER_API_KEY is not set in environment variables');
    }
    this.client = new Together({ apiKey: process.env.TOGETHER_API_KEY });
  }

  async generateImagePrompt({
    characterName,
    characterDescription,
    systemPrompt,
    postType = 'social'
  }: PromptGenerationRequest): Promise<PromptGenerationResponse> {
    try {
      console.log('Prompt Generation Service - Input Parameters:', {
        characterName,
        characterDescription,
        postType
      });

      const prompt = this.buildPrompt(characterName, characterDescription, systemPrompt, postType);

      const response = await this.client.chat.completions.create({
        model: 'togethercomputer/llama-2-70b-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
        top_p: 0.9,
        top_k: 50,
        repetition_penalty: 1.1,
        stop: ['</s>', 'Human:', 'Assistant:']
      });

      if (!response.choices?.[0]?.message?.content) {
        throw new Error('No response generated from LLM');
      }

      const generatedText = response.choices[0].message.content.trim();
      
      // Parse the response to extract image prompt, title, and description
      const parsed = this.parseLLMResponse(generatedText);

      return {
        imagePrompt: parsed.imagePrompt,
        postTitle: parsed.postTitle,
        postDescription: parsed.postDescription
      };
    } catch (error) {
      console.error('Prompt Generation Error:', error);
      throw new Error('Failed to generate image prompt');
    }
  }

  private buildPrompt(
    characterName: string,
    characterDescription: string,
    systemPrompt: string,
    postType: string
  ): string {
    const postTypeContext = {
      social: 'social media post that would engage followers',
      professional: 'professional headshot or business setting',
      casual: 'casual, relaxed, everyday setting',
      creative: 'creative, artistic, or imaginative scene'
    };

    return `<s>[INST] You are an expert at creating image prompts for AI image generation. 

Character Information:
- Name: ${characterName}
- Description: ${characterDescription}
- System Prompt: ${systemPrompt}

Task: Create an image prompt for a ${postTypeContext[postType as keyof typeof postTypeContext] || 'social media post'} featuring this character.

Requirements:
1. The image prompt should be detailed and descriptive
2. Include visual elements that reflect the character's personality and expertise
3. Make it suitable for AI image generation (clear, specific, visual)
4. Keep it under 200 words
5. Include lighting, setting, and style details

Format your response as:
IMAGE_PROMPT: [your detailed image prompt here]
POST_TITLE: [a catchy title for the social media post]
POST_DESCRIPTION: [a brief description or caption for the post]

Example:
IMAGE_PROMPT: Professional headshot of a confident business consultant in a modern office, wearing a sharp navy suit, warm lighting, professional background, high quality, detailed facial features, approachable expression
POST_TITLE: Ready to help you scale your business! 🚀
POST_DESCRIPTION: Let's discuss your growth strategy and unlock your business potential.

[/INST]</s>`;
  }

  private parseLLMResponse(response: string): {
    imagePrompt: string;
    postTitle?: string;
    postDescription?: string;
  } {
    const lines = response.split('\n');
    let imagePrompt = '';
    let postTitle = '';
    let postDescription = '';

    for (const line of lines) {
      if (line.startsWith('IMAGE_PROMPT:')) {
        imagePrompt = line.replace('IMAGE_PROMPT:', '').trim();
      } else if (line.startsWith('POST_TITLE:')) {
        postTitle = line.replace('POST_TITLE:', '').trim();
      } else if (line.startsWith('POST_DESCRIPTION:')) {
        postDescription = line.replace('POST_DESCRIPTION:', '').trim();
      }
    }

    // Fallback: if parsing fails, use the entire response as image prompt
    if (!imagePrompt) {
      imagePrompt = response.trim();
    }

    return {
      imagePrompt,
      postTitle: postTitle || undefined,
      postDescription: postDescription || undefined
    };
  }
}

// Export a singleton instance
export const promptGenerationService = new PromptGenerationService(); 