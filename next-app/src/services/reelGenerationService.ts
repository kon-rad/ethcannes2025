import { PromptGenerationService, CharacterData } from './promptGenerationService';

export interface ReelGenerationInput {
  characterData: CharacterData;
  customPrompt?: string;
  additionalContext?: string;
}

export interface ReelGenerationResponse {
  success: boolean;
  message: string;
  generatedPrompt?: string;
  reelUrl?: string;
}

export class ReelGenerationService {
  private promptService: PromptGenerationService;

  constructor() {
    this.promptService = new PromptGenerationService();
  }

  async generateReel(input: ReelGenerationInput): Promise<ReelGenerationResponse> {
    console.log('🎬 Reel Generation Service - Starting reel generation...');
    console.log('📋 Input parameters:', {
      characterName: input.characterData.name,
      characterDescription: input.characterData.description,
      hasCustomPrompt: !!input.customPrompt,
      hasAdditionalContext: !!input.additionalContext
    });

    try {
      // Step 1: Generate prompt using the prompt service
      console.log('🔤 Step 1: Generating reel prompt...');
      const generatedPrompt = await this.promptService.generateReelPrompt(
        input.characterData,
        input.customPrompt,
        input.additionalContext
      );
      console.log('✅ Generated prompt:', generatedPrompt);

      // Step 2: Validate the generated prompt
      console.log('🔍 Step 2: Validating generated prompt...');
      if (!generatedPrompt || generatedPrompt.trim().length === 0) {
        throw new Error('Generated prompt is empty or invalid');
      }
      console.log('✅ Prompt validation passed');

      // Step 3: Prepare reel generation parameters
      console.log('⚙️ Step 3: Preparing reel generation parameters...');
      const reelParams = {
        prompt: generatedPrompt,
        characterName: input.characterData.name,
        characterDescription: input.characterData.description,
        duration: '15-30 seconds', // Typical reel duration
        aspectRatio: '9:16', // Vertical format for reels
        style: 'social media friendly',
        targetPlatform: 'Instagram/TikTok'
      };
      console.log('✅ Reel parameters prepared:', reelParams);

      // Step 4: Simulate reel generation process
      console.log('🎥 Step 4: Simulating reel generation process...');
      console.log('📹 This would typically involve:');
      console.log('   - Calling video generation API (e.g., Runway, Pika Labs)');
      console.log('   - Processing the video with character-specific styling');
      console.log('   - Adding audio/sound effects if needed');
      console.log('   - Optimizing for social media platforms');
      console.log('   - Uploading to cloud storage');

      // Step 5: Simulate successful generation
      console.log('🎉 Step 5: Simulating successful reel generation...');
      const mockReelUrl = `https://example.com/reels/${input.characterData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.mp4`;
      console.log('✅ Mock reel URL generated:', mockReelUrl);

      // Step 6: Return success response
      console.log('🏁 Step 6: Returning success response...');
      return {
        success: true,
        message: 'Reel generated successfully (simulation)',
        generatedPrompt,
        reelUrl: mockReelUrl
      };

    } catch (error) {
      console.error('❌ Reel generation failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        generatedPrompt: undefined,
        reelUrl: undefined
      };
    }
  }

  async generateReelWithCustomPrompt(
    characterData: CharacterData,
    customPrompt: string,
    additionalContext?: string
  ): Promise<ReelGenerationResponse> {
    return this.generateReel({
      characterData,
      customPrompt,
      additionalContext
    });
  }

  async generateReelWithAutoPrompt(
    characterData: CharacterData,
    additionalContext?: string
  ): Promise<ReelGenerationResponse> {
    return this.generateReel({
      characterData,
      additionalContext
    });
  }
} 