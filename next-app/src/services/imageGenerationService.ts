import Together from 'together-ai';
import { S3Service } from './s3.service';

export interface ImageGenerationRequest {
  prompt: string;
  steps?: number;
  n?: number;
  model?: string;
  conditionImage?: string; // Base64 or URL of existing image
}

export interface ImageGenerationResponse {
  images: string[]; // Base64 encoded images
  model: string;
  prompt: string;
  steps?: number; // Optional for FLUX.1 Dev
  n: number;
}

export class ImageGenerationService {
  private client: Together;
  private s3Service: S3Service;

  constructor() {
    console.log('=== ImageGenerationService Constructor ===');
    console.log('TOGETHER_API_KEY exists:', !!process.env.TOGETHER_API_KEY);
    console.log('TOGETHER_API_KEY length:', process.env.TOGETHER_API_KEY?.length);
    console.log('TOGETHER_API_KEY prefix:', process.env.TOGETHER_API_KEY?.substring(0, 10) + '...');
    
    if (!process.env.TOGETHER_API_KEY) {
      throw new Error('TOGETHER_API_KEY is not set in environment variables');
    }
    
    console.log('Creating Together AI client...');
    this.client = new Together({ apiKey: process.env.TOGETHER_API_KEY });
    console.log('Together AI client created successfully');
    console.log('Client type:', typeof this.client);
    console.log('Client has images property:', !!this.client.images);
    console.log('Client images type:', typeof this.client.images);
    console.log('Client images has create method:', !!this.client.images?.create);
    
    this.s3Service = new S3Service();
    console.log('S3Service created successfully');
  }

  async generateImages({
    prompt,
    steps = 28,
    n = 1,
    model,
    conditionImage
  }: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    // Use the best model if none specified
    const selectedModel = model || this.getBestModel(!!conditionImage);
    
    try {
      console.log('Image Generation Service - Input Parameters:', {
        model: selectedModel,
        prompt,
        steps,
        n,
        hasConditionImage: !!conditionImage
      });

      let response: any;

      // Handle FLUX Kontext models differently
      if (selectedModel.includes('FLUX.1-kontext')) {
        const requestBody: any = {
          model: selectedModel,
          prompt,
          width: 1024,
          height: 1024
        };

        // Add image_url if provided for FLUX Kontext
        if (conditionImage) {
          console.log('Processing condition image for FLUX Kontext:', conditionImage);
          // Validate and preprocess condition image
          const validation = this.validateConditionImage(conditionImage);
          console.log('Condition image validation result:', validation);
          
          if (!validation.isValid) {
            console.warn('Condition image validation failed:', validation.error);
            // If condition image is invalid, try without it using FLUX.1 Dev
            console.log('Falling back to FLUX.1 Dev due to invalid condition image...');
            return await this.generateImages({
              prompt,
              steps,
              n,
              model: 'black-forest-labs/FLUX.1-dev'
              // No conditionImage
            });
          } else {
            // For FLUX Kontext, we need to convert base64 to URL or use URL directly
            if (validation.processedImage?.startsWith('http')) {
              console.log('Using HTTP URL as condition image:', validation.processedImage);
              requestBody.image_url = validation.processedImage;
            } else {
              // Convert base64 to S3 URL for FLUX Kontext
              try {
                console.log('Converting base64 image to S3 URL for FLUX Kontext...');
                const imageUrl = await this.convertBase64ToUrl(validation.processedImage!);
                requestBody.image_url = imageUrl;
              } catch (conversionError) {
                console.warn('Failed to convert base64 to URL, falling back to FLUX.1 Dev...', conversionError);
                return await this.generateImages({
                  prompt,
                  steps,
                  n,
                  model: 'black-forest-labs/FLUX.1-dev'
                  // No conditionImage
                });
              }
            }
          }
        }

        // Use the same create method but with different parameters for FLUX Kontext
        console.log('Making FLUX Kontext API call to Together AI...');
        
        // Add timeout to prevent hanging requests
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 second timeout
        });
        
        const apiPromise = this.client.images.create(requestBody);
        response = await Promise.race([apiPromise, timeoutPromise]) as any;
      } else if (selectedModel.includes('FLUX.1-dev')) {
        // Handle FLUX.1 Dev model specifically with retry logic
        const requestBody: any = {
          model: selectedModel,
          prompt,
          n
        };

        console.log('=== FLUX.1 Dev Image Generation Debug ===');
        console.log('Request body:', JSON.stringify(requestBody, null, 2));
        console.log('Together AI client:', typeof this.client);
        console.log('Client methods:', Object.keys(this.client));
        
        // Retry logic for FLUX.1 Dev
        const maxRetries = 3;
        let lastError: any = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`Making API call to Together AI (attempt ${attempt}/${maxRetries})...`);
            
            // Add timeout to prevent hanging requests
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 second timeout
            });
            
            const apiPromise = this.client.images.create(requestBody);
            response = await Promise.race([apiPromise, timeoutPromise]) as any;
            console.log('API call successful!');
            console.log('Response type:', typeof response);
            console.log('Response keys:', Object.keys(response || {}));
            console.log('Response data:', response?.data ? 'Present' : 'Missing');
            console.log('Response data length:', response?.data?.length);
            
            // If we get here, the call was successful
            break;
          } catch (apiError) {
            lastError = apiError;
            console.error(`=== FLUX.1 Dev API Error (Attempt ${attempt}/${maxRetries}) ===`);
            console.error('Error type:', typeof apiError);
            console.error('Error message:', apiError instanceof Error ? apiError.message : 'Unknown error');
            console.error('Error stack:', apiError instanceof Error ? apiError.stack : 'No stack');
            
            // Check if it's a rate limit or temporary error
            const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';
            const isRetryable = errorMessage.includes('rate_limit') || 
                               errorMessage.includes('429') || 
                               errorMessage.includes('500') || 
                               errorMessage.includes('502') || 
                               errorMessage.includes('503') || 
                               errorMessage.includes('504') ||
                               errorMessage.includes('timeout') ||
                               errorMessage.includes('network');
            
            if (isRetryable && attempt < maxRetries) {
              const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
              console.log(`Retryable error detected. Waiting ${delay}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            } else {
              console.error('Non-retryable error or max retries reached. Throwing error.');
              throw apiError;
            }
          }
        }
        
        // If we get here without a successful response, throw the last error
        if (!response) {
          throw lastError || new Error('Failed to generate image after all retries');
        }
      } else {
        // Handle other models (like Stable Diffusion XL) with the original API
        const requestBody: any = {
          model: selectedModel,
          prompt,
          steps,
          n
        };

        response = await this.client.images.create(requestBody);
      }

      if (!response.data || response.data.length === 0) {
        throw new Error('No images generated');
      }

      // Convert images to data URLs
      const images = response.data.map((image: any) => {
        console.log('Processing image response:', {
          hasB64Json: !!image.b64_json,
          hasUrl: !!image.url,
          b64JsonLength: image.b64_json?.length,
          urlLength: image.url?.length
        });

        if (image.b64_json) {
          const dataUrl = `data:image/png;base64,${image.b64_json}`;
          console.log('Created data URL from b64_json, length:', dataUrl.length);
          return dataUrl;
        } else if (image.url) {
          // FLUX Kontext returns URLs, return them directly
          console.log('Using URL from FLUX Kontext:', image.url);
          return image.url;
        }
        console.log('No valid image data found');
        return null;
      }).filter((img: string | null): img is string => img !== null);

      console.log('Final processed images:', {
        count: images.length,
        imageTypes: images.map((img: string) => typeof img),
        imageLengths: images.map((img: string) => img?.length)
      });

      return {
        images,
        model: selectedModel,
        prompt,
        steps: selectedModel.includes('FLUX.1-dev') ? undefined : steps,
        n
      };
    } catch (error: unknown) {
      console.error('Image Generation Error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      // If FLUX.1 Kontext fails and we have a condition image, try fallback to FLUX.1 Dev
      if (selectedModel.includes('FLUX.1-kontext') && conditionImage) {
        console.log('FLUX.1 Kontext failed, attempting fallback to FLUX.1 Dev...');
        
        try {
          // Try without condition image since FLUX.1 Dev doesn't support it
          console.log('Making fallback FLUX.1 Dev API call...');
          
          // Add timeout to prevent hanging requests
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 second timeout
          });
          
          const apiPromise = this.client.images.create({
            model: 'black-forest-labs/FLUX.1-dev',
            prompt,
            n
          });
          
          const fallbackResponse = await Promise.race([apiPromise, timeoutPromise]) as any;

          if (fallbackResponse.data && fallbackResponse.data.length > 0) {
            const images = fallbackResponse.data.map((image: any) => {
              if (image.b64_json) {
                return `data:image/png;base64,${image.b64_json}`;
              }
              return null;
            }).filter((img: string | null): img is string => img !== null);

            console.log('Fallback to FLUX.1 Dev successful');
            return {
              images,
              model: 'black-forest-labs/FLUX.1-dev',
              prompt,
              n
            };
          }
        } catch (fallbackError) {
          console.error('Fallback to FLUX.1 Dev also failed:', fallbackError);
        }
      }

      // Check for specific error types and provide better error messages
      if (error instanceof Error) {
        console.error('=== Final Error Analysis ===');
        console.error('Error message:', error.message);
        console.error('Error name:', error.name);
        
        if (error.message.includes('500')) {
          throw new Error('Image generation service temporarily unavailable. Please try again.');
        } else if (error.message.includes('rate_limit') || error.message.includes('429')) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        } else if (error.message.includes('invalid_api_key')) {
          throw new Error('Invalid API key. Please check your configuration.');
        } else if (error.message.includes('insufficient_quota')) {
          throw new Error('Insufficient quota. Please check your Together AI account.');
        } else if (error.message.includes('400')) {
          throw new Error('Invalid request format. Please check your prompt and try again.');
        } else if (error.message.includes('timeout')) {
          throw new Error('Request timed out. Please try again.');
        } else if (error.message.includes('network')) {
          throw new Error('Network error. Please check your connection and try again.');
        }
      }

      // If we get here, provide a generic error with the original message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate images: ${errorMessage}`);
    }
  }

  async generateCharacterImage(
    characterName: string,
    characterDescription: string,
    customPrompt?: string,
    existingImageUrl?: string
  ): Promise<string> {
    try {
      // Create a more relevant, on-brand prompt if none provided
      const defaultPrompt = customPrompt || 
        `Create a new social media post image featuring ${characterName}, ${characterDescription}. The image should be on-topic and relevant to their expertise and personality. High quality, detailed, professional lighting, engaging composition that fits their brand and content style. 
        
        
        Keep the same character face. The face of the character should be the same as the existing image. The rest of the image can be modified as 
        `;

      // If no existing image, use Stable Diffusion XL directly
      if (!existingImageUrl) {
        return await this.generateInitialCharacterImage(characterName, characterDescription, customPrompt);
      }

      // Try FLUX.1 Kontext first, fallback to Stable Diffusion XL if it fails
      try {
        console.log('Attempting to generate image with FLUX.1 Kontext and condition image...');
        const response = await this.generateImages({
          prompt: defaultPrompt,
          steps: 28,
          n: 1,
          model: 'black-forest-labs/FLUX.1-kontext-dev',
          conditionImage: existingImageUrl
        });

        if (response.images.length > 0) {
          console.log('FLUX.1 Kontext generation successful');
          return response.images[0];
        }
      } catch (fluxError) {
        console.warn('FLUX.1 Kontext failed, falling back to FLUX.1 Dev:', fluxError);
        
        // Fallback to FLUX.1 Dev without condition image
        try {
          console.log('Attempting fallback with FLUX.1 Dev...');
                  const fallbackResponse = await this.generateImages({
          prompt: defaultPrompt,
          n: 1,
          model: 'black-forest-labs/FLUX.1-dev'
          // Note: No conditionImage for FLUX.1 Dev
        });

          if (fallbackResponse.images.length > 0) {
            console.log('FLUX.1 Dev fallback successful');
            return fallbackResponse.images[0];
          }
        } catch (fallbackError) {
          console.error('FLUX.1 Dev fallback also failed:', fallbackError);
          throw fallbackError;
        }
      }

      throw new Error('No image generated from any model');
    } catch (error) {
      console.error('Character image generation error:', error);
      throw error;
    }
  }

  async generateInitialCharacterImage(
    characterName: string,
    characterDescription: string,
    customPrompt?: string
  ): Promise<string> {
    try {
      // Create a more relevant, on-brand prompt if none provided
      const defaultPrompt = customPrompt || 
        `Create a new social media post image featuring ${characterName}, ${characterDescription}. The image should be on-topic and relevant to their expertise and personality. High quality, detailed, professional lighting, engaging composition that fits their brand and content style.`;

      // Use FLUX.1 Dev for initial character images
      const response = await this.generateImages({
        prompt: defaultPrompt,
        n: 1,
        model: 'black-forest-labs/FLUX.1-dev'
      });

      if (response.images.length > 0) {
        return response.images[0];
      } else {
        throw new Error('No image generated');
      }
    } catch (error) {
      console.error('Initial character image generation error:', error);
      throw error;
    }
  }

  async uploadImageToS3(base64Image: string, characterId: string): Promise<string> {
    try {
      console.log('Uploading image to S3:', {
        base64ImageType: typeof base64Image,
        base64ImageLength: base64Image?.length,
        characterId
      });

      let buffer: Buffer;

      // Check if it's a URL (starts with http)
      if (base64Image.startsWith('http')) {
        console.log('Detected URL, downloading image...');
        // Download the image from the URL
        const response = await fetch(base64Image);
        if (!response.ok) {
          throw new Error(`Failed to download image from URL: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
        console.log('Downloaded image buffer length:', buffer.length);
      } else {
        // Handle base64 data
        console.log('Detected base64 data, processing...');
        // Remove data URL prefix if present
        const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
        console.log('Base64 data length after prefix removal:', base64Data.length);
        
        // Convert base64 to buffer
        buffer = Buffer.from(base64Data, 'base64');
        console.log('Base64 buffer length:', buffer.length);
      }
      
      // Generate unique filename
      const timestamp = Date.now();
      const key = `characters/${characterId}/avatar-${timestamp}.png`;
      console.log('S3 key:', key);
      
      // Upload to S3
      const s3Url = await this.s3Service.uploadBuffer(buffer, key, 'image/png');
      
      console.log('Image uploaded to S3:', s3Url);
      return s3Url;
    } catch (error) {
      console.error('Error uploading image to S3:', error);
      throw new Error('Failed to upload image to S3');
    }
  }

  async generateAndUploadCharacterImage(
    characterId: string,
    characterName: string,
    characterDescription: string,
    customPrompt?: string,
    existingImageUrl?: string
  ): Promise<string> {
    try {
      // Generate the image
      const base64Image = await this.generateCharacterImage(
        characterName,
        characterDescription,
        customPrompt,
        existingImageUrl
      );
      
      // Upload to S3
      const s3Url = await this.uploadImageToS3(base64Image, characterId);
      
      return s3Url;
    } catch (error) {
      console.error('Error in generateAndUploadCharacterImage:', error);
      throw error;
    }
  }

  async generateMultipleCharacterImages(
    characterName: string,
    characterDescription: string,
    customPrompt?: string,
    count: number = 4
  ): Promise<string[]> {
    try {
      const defaultPrompt = customPrompt || 
        `Create a new social media post image featuring ${characterName}, ${characterDescription}. The image should be on-topic and relevant to their expertise and personality. High quality, detailed, professional lighting, engaging composition that fits their brand and content style.`;

      const response = await this.generateImages({
        prompt: defaultPrompt,
        n: count
      });

      return response.images;
    } catch (error) {
      console.error('Multiple character image generation error:', error);
      throw error;
    }
  }

  // Helper method to validate image prompts
  validatePrompt(prompt: string): { isValid: boolean; error?: string } {
    if (!prompt || prompt.trim().length === 0) {
      return { isValid: false, error: 'Prompt cannot be empty' };
    }

    if (prompt.length > 1000) {
      return { isValid: false, error: 'Prompt too long (max 1000 characters)' };
    }

    // Basic content filtering (you can expand this)
    const inappropriateContent = ['nude', 'naked', 'explicit', 'inappropriate'];
    const lowerPrompt = prompt.toLowerCase();
    
    for (const content of inappropriateContent) {
      if (lowerPrompt.includes(content)) {
        return { isValid: false, error: 'Prompt contains inappropriate content' };
      }
    }

    return { isValid: true };
  }

  // Helper method to validate and preprocess condition images
  private validateConditionImage(conditionImage: string): { isValid: boolean; processedImage?: string; error?: string } {
    try {
      // Check if it's a valid URL
      if (conditionImage.startsWith('http://') || conditionImage.startsWith('https://')) {
        // Trust that our generated URLs are valid
        console.log('Accepting HTTP/HTTPS URL as condition image:', conditionImage);
        return { isValid: true, processedImage: conditionImage };
      }

      // Check if it's a valid base64 data URL
      if (conditionImage.startsWith('data:image/')) {
        // Validate base64 format
        const base64Data = conditionImage.split(',')[1];
        if (!base64Data) {
          return { isValid: false, error: 'Invalid base64 image format' };
        }

        // Check if it's valid base64
        try {
          Buffer.from(base64Data, 'base64');
          return { isValid: true, processedImage: conditionImage };
        } catch {
          return { isValid: false, error: 'Invalid base64 encoding' };
        }
      }

      // Check if it's raw base64 (without data URL prefix)
      try {
        Buffer.from(conditionImage, 'base64');
        // Convert to data URL format
        const processedImage = `data:image/png;base64,${conditionImage}`;
        return { isValid: true, processedImage };
      } catch {
        return { isValid: false, error: 'Invalid image format' };
      }
    } catch (error) {
      return { isValid: false, error: 'Failed to validate condition image' };
    }
  }

  // Helper method to get the best model for image generation
  private getBestModel(hasConditionImage: boolean): string {
    if (hasConditionImage) {
      // FLUX.1 Kontext supports condition images
      return 'black-forest-labs/FLUX.1-kontext-dev';
    } else {
      // Use FLUX.1 Dev for general image generation (no condition image needed)
      return 'black-forest-labs/FLUX.1-dev';
    }
  }

  // Helper method to convert base64 image to S3 URL for FLUX Kontext
  private async convertBase64ToUrl(base64Image: string): Promise<string> {
    try {
      // Remove data URL prefix if present
      const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Generate unique filename for temporary upload
      const timestamp = Date.now();
      const key = `temp/flux-kontext-${timestamp}.png`;
      
      // Upload to S3
      const s3Url = await this.s3Service.uploadBuffer(buffer, key, 'image/png');
      
      console.log('Base64 image converted to S3 URL for FLUX Kontext:', s3Url);
      return s3Url;
    } catch (error) {
      console.error('Error converting base64 to URL:', error);
      throw new Error('Failed to convert base64 image to URL');
    }
  }

  // Method to test different models and find the best working one
  async testModels(prompt: string, conditionImage?: string): Promise<{ model: string; success: boolean; error?: string }[]> {
    const models = [
      'black-forest-labs/FLUX.1-dev',
      'black-forest-labs/FLUX.1-schnell',
      'black-forest-labs/FLUX.1-kontext-dev'
    ];

    const results = [];

    for (const model of models) {
      try {
        console.log(`Testing model: ${model}`);
        
        let requestBody: any;

        if (model.includes('FLUX.1-kontext')) {
          requestBody = {
            model,
            prompt,
            width: 1024,
            height: 1024
          };

          // Add image_url if provided for FLUX Kontext
          if (conditionImage) {
            const validation = this.validateConditionImage(conditionImage);
            if (validation.isValid && validation.processedImage?.startsWith('http')) {
              requestBody.image_url = validation.processedImage;
            } else {
              console.log(`Skipping condition image for ${model} due to invalid format`);
            }
          }
        } else if (model.includes('FLUX.1-dev')) {
          requestBody = {
            model,
            prompt,
            n: 1
          };
        } else {
          requestBody = {
            model,
            prompt,
            steps: 10, // Use fewer steps for testing
            n: 1
          };
        }

        const response = await this.client.images.create(requestBody);
        
        if (response.data && response.data.length > 0) {
          results.push({ model, success: true });
          console.log(`Model ${model} test successful`);
        } else {
          results.push({ model, success: false, error: 'No images generated' });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ model, success: false, error: errorMessage });
        console.log(`Model ${model} test failed:`, errorMessage);
      }
    }

    return results;
  }
}

// Export a singleton instance
export const imageGenerationService = new ImageGenerationService(); 