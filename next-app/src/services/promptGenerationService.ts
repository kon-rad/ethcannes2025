import { summarizeWithAI } from './aiService';

export interface CharacterData {
  name: string;
  description: string;
  systemPrompt: string;
  imageUrl?: string;
}

export interface PromptGenerationInput {
  characterData: CharacterData;
  contentType: 'text' | 'image' | 'video' | 'reel';
  customPrompt?: string;
  additionalContext?: string;
}

export class PromptGenerationService {
  async generatePrompt(input: PromptGenerationInput): Promise<string> {
    const { characterData, contentType, customPrompt, additionalContext } = input;

    let systemPrompt: string;
    let userMessage: string;

    switch (contentType) {
      case 'text':
        systemPrompt = `You are an expert at writing engaging social media text posts. Create a compelling, authentic post that matches the character's personality and voice.`;
        userMessage = `Character name: ${characterData.name}
Character description: ${characterData.description}
Character system prompt: ${characterData.systemPrompt}
${additionalContext ? `Additional context: ${additionalContext}` : ''}

${customPrompt ? `Custom prompt direction: ${customPrompt}` : 'Generate an engaging social media post that reflects this character\'s personality and interests.'}`;
        break;

      case 'image':
        systemPrompt = `You are an expert at writing detailed image generation prompts for social media posts. Create a comprehensive prompt for generating an image that captures the character's appearance, personality, and expertise in a way that's relevant to their brand and content style.`;
        userMessage = `Character name: ${characterData.name}
Character description: ${characterData.description}
Character system prompt: ${characterData.systemPrompt}
${additionalContext ? `Additional context: ${additionalContext}` : ''}

${customPrompt ? `Custom prompt direction: ${customPrompt}` : 'Generate a detailed image generation prompt for a social media post featuring this character that is relevant to their expertise and personality.'}`;
        break;

      case 'video':
        systemPrompt = `You are an expert at writing video generation prompts. Create a detailed prompt for generating a short video that showcases the character's personality and activities.`;
        userMessage = `Character name: ${characterData.name}
Character description: ${characterData.description}
Character system prompt: ${characterData.systemPrompt}
${additionalContext ? `Additional context: ${additionalContext}` : ''}

${customPrompt ? `Custom prompt direction: ${customPrompt}` : 'Generate a detailed video generation prompt for a short clip featuring this character.'}`;
        break;

      case 'reel':
        systemPrompt = `You are an expert at writing engaging social media reel prompts. Create a compelling prompt for generating a short, viral-style reel that showcases the character's personality and interests.`;
        userMessage = `Character name: ${characterData.name}
Character description: ${characterData.description}
Character system prompt: ${characterData.systemPrompt}
${additionalContext ? `Additional context: ${additionalContext}` : ''}

${customPrompt ? `Custom prompt direction: ${customPrompt}` : 'Generate a detailed reel generation prompt for a short, engaging social media video featuring this character.'}`;
        break;

      default:
        throw new Error(`Unsupported content type: ${contentType}`);
    }

    try {
      const generatedPrompt = await summarizeWithAI({
        systemPrompt,
        userMessage
      });

      return generatedPrompt;
    } catch (error) {
      console.error('Error generating prompt:', error);
      throw new Error(`Failed to generate ${contentType} prompt`);
    }
  }

  async generateTextPrompt(characterData: CharacterData, customPrompt?: string, additionalContext?: string): Promise<string> {
    return this.generatePrompt({
      characterData,
      contentType: 'text',
      customPrompt,
      additionalContext
    });
  }

  async generateImagePrompt(characterData: CharacterData, customPrompt?: string, additionalContext?: string): Promise<string> {
    return this.generatePrompt({
      characterData,
      contentType: 'image',
      customPrompt,
      additionalContext
    });
  }

  async generateAutoPostContent(characterData: CharacterData, postType: string): Promise<{
    imagePrompt: string;
    postTitle: string;
    postDescription: string;
  }> {
    try {
      // Generate image prompt
      const imagePrompt = await this.generatePrompt({
        characterData,
        contentType: 'image',
        customPrompt: `Create a new social media post image that's relevant to ${characterData.name}'s expertise and personality. The image should be on-topic and on-brand for a ${postType} style post.`,
        additionalContext: `Post type: ${postType}`
      });

      // Generate post title
      const titlePrompt = await this.generatePrompt({
        characterData,
        contentType: 'text',
        customPrompt: `Create a short, engaging title for a ${postType} social media post that reflects ${characterData.name}'s expertise and personality. Keep it under 60 characters.`,
        additionalContext: `Post type: ${postType}`
      });

      // Generate post description
      const descriptionPrompt = await this.generatePrompt({
        characterData,
        contentType: 'text',
        customPrompt: `Create a brief, engaging description for a ${postType} social media post that reflects ${characterData.name}'s expertise and personality. Keep it under 200 characters.`,
        additionalContext: `Post type: ${postType}`
      });

      return {
        imagePrompt,
        postTitle: titlePrompt,
        postDescription: descriptionPrompt
      };
    } catch (error) {
      console.error('Error generating auto post content:', error);
      throw new Error('Failed to generate auto post content');
    }
  }

  async generateVideoPrompt(characterData: CharacterData, customPrompt?: string, additionalContext?: string): Promise<string> {
    return this.generatePrompt({
      characterData,
      contentType: 'video',
      customPrompt,
      additionalContext
    });
  }

  async generateReelPrompt(characterData: CharacterData, customPrompt?: string, additionalContext?: string): Promise<string> {
    return this.generatePrompt({
      characterData,
      contentType: 'reel',
      customPrompt,
      additionalContext
    });
  }
}

// Export a singleton instance
export const promptGenerationService = new PromptGenerationService(); 