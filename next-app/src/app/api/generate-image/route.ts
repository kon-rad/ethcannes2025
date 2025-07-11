import { NextRequest, NextResponse } from 'next/server';
import { imageGenerationService } from '@/services/imageGenerationService';
import { generateImagePromptWithAI } from '@/services/aiService';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { 
      prompt, 
      postPrompt, // New parameter for post-specific prompt
      postType = 'image', // New parameter for post type
      characterId,
      characterName, 
      characterDescription, 
      existingImageUrl,
      steps = 28, 
      n = 1,
      userId, // Add userId to save posts
      useCurrentState = false // Flag to use current state search results
    } = await request.json();

    if (!prompt && !postPrompt && (!characterName || !characterDescription)) {
      return NextResponse.json(
        { error: 'Either prompt, postPrompt, or characterName + characterDescription are required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required to save the generated image as a post' },
        { status: 400 }
      );
    }

    // Get current state search results if requested
    let currentStateSearchResults: string | null = null;
    if (useCurrentState && characterId) {
      try {
        const currentState = await prisma.currentState.findUnique({
          where: {
            userId_characterId: {
              userId,
              characterId
            }
          }
        });
        currentStateSearchResults = currentState?.searchResults || null;
        console.log('Current state search results found:', !!currentStateSearchResults);
      } catch (error) {
        console.warn('Failed to fetch current state search results:', error);
        // Continue without search results
      }
    }

    // Generate AI prompt if postPrompt is provided and we have search results
    let finalPrompt = prompt;
    if (postPrompt && currentStateSearchResults && characterName && characterDescription) {
      try {
        console.log('Generating AI image prompt with current state context...');
        finalPrompt = await generateImagePromptWithAI({
          characterName,
          characterDescription,
          postPrompt,
          searchResults: currentStateSearchResults
        });
        console.log('AI-generated prompt:', finalPrompt);
      } catch (error) {
        console.error('Failed to generate AI prompt, falling back to postPrompt:', error);
        finalPrompt = postPrompt;
      }
    } else if (postPrompt) {
      // Use postPrompt directly if no search results available
      finalPrompt = postPrompt;
    }

    // Validate final prompt
    if (finalPrompt) {
      const validation = imageGenerationService.validatePrompt(finalPrompt);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }
    }

    let imageUrl: string;
    let usedModel: string = 'unknown';

    // Use the finalPrompt that was generated above, or fall back to original logic
    if (finalPrompt) {
      // Generate image with the AI-generated or provided prompt
      console.log('Using final prompt:', finalPrompt);
      console.log('Post type:', postType);
      
      // Handle different post types
      if (postType === 'image-flux') {
        // Use FLUX.1 Dev without condition image for image-flux type
        console.log('=== API Route: FLUX.1 Dev Generation ===');
        console.log('Post type:', postType);
        console.log('Final prompt:', finalPrompt);
        console.log('Prompt length:', finalPrompt?.length);
        
        try {
          console.log('Calling imageGenerationService.generateImages...');
          const response = await imageGenerationService.generateImages({
            prompt: finalPrompt,
            n: 1,
            model: 'black-forest-labs/FLUX.1-dev'
            // No conditionImage for FLUX.1 Dev
          });
          console.log('Image generation service response received');
          console.log('Response model:', response.model);
          console.log('Response images count:', response.images?.length);
          console.log('First image type:', typeof response.images[0]);
          console.log('First image length:', response.images[0]?.length);
          
          imageUrl = response.images[0];
          usedModel = response.model;
          console.log('Image URL extracted successfully');
        } catch (serviceError) {
          console.error('=== API Route: Image Generation Service Error ===');
          console.error('Error type:', typeof serviceError);
          console.error('Error message:', serviceError instanceof Error ? serviceError.message : 'Unknown error');
          console.error('Error stack:', serviceError instanceof Error ? serviceError.stack : 'No stack');
          throw serviceError;
        }
      } else {
        // Use default logic with condition image for other types
        console.log('Using condition image for standard image type:', existingImageUrl);
        const response = await imageGenerationService.generateImages({
          prompt: finalPrompt,
          steps,
          n: 1,
          conditionImage: existingImageUrl
        });
        imageUrl = response.images[0];
        usedModel = response.model;
      }
    } else if (prompt) {
      // Fallback to original prompt logic
      console.log('Using original prompt:', prompt);
      console.log('Post type:', postType);
      
      // Handle different post types
      if (postType === 'image-flux') {
        // Use FLUX.1 Dev without condition image for image-flux type
        console.log('=== API Route: FLUX.1 Dev Generation (Fallback) ===');
        console.log('Post type:', postType);
        console.log('Original prompt:', prompt);
        console.log('Prompt length:', prompt?.length);
        
        try {
          console.log('Calling imageGenerationService.generateImages (fallback)...');
          const response = await imageGenerationService.generateImages({
            prompt: prompt,
            n: 1,
            model: 'black-forest-labs/FLUX.1-dev'
            // No conditionImage for FLUX.1 Dev
          });
          console.log('Image generation service response received (fallback)');
          console.log('Response model:', response.model);
          console.log('Response images count:', response.images?.length);
          
          imageUrl = response.images[0];
          usedModel = response.model;
          console.log('Image URL extracted successfully (fallback)');
        } catch (serviceError) {
          console.error('=== API Route: Image Generation Service Error (Fallback) ===');
          console.error('Error type:', typeof serviceError);
          console.error('Error message:', serviceError instanceof Error ? serviceError.message : 'Unknown error');
          console.error('Error stack:', serviceError instanceof Error ? serviceError.stack : 'No stack');
          throw serviceError;
        }
      } else {
        // Use default logic with condition image for other types
        console.log('Using condition image for standard image type:', existingImageUrl);
        const response = await imageGenerationService.generateImages({
          prompt: prompt,
          steps,
          n: 1,
          conditionImage: existingImageUrl
        });
        imageUrl = response.images[0];
        usedModel = response.model;
      }
    } else {
      // Generate character image with S3 upload
      if (characterId) {
        if (existingImageUrl && postType !== 'image-flux') {
          // Use FLUX.1 Kontext with conditional image (except for image-flux type)
          const defaultPrompt = `Create a new social media post image featuring ${characterName}, ${characterDescription}. The image should be on-topic and relevant to their expertise and personality. High quality, detailed, professional lighting, engaging composition that fits their brand and content style. Keep the face of the person in the original image. You can change everything else except the face. `;
          finalPrompt = defaultPrompt;
          console.log('Using FLUX.1 Kontext with condition image. Prompt:', finalPrompt);
          console.log('Character avatar URL for condition:', existingImageUrl);
          imageUrl = await imageGenerationService.generateAndUploadCharacterImage(
            characterId,
            characterName,
            characterDescription,
            defaultPrompt,
            existingImageUrl
          );
          usedModel = 'black-forest-labs/FLUX.1-kontext-dev';
        } else {
          // Generate initial image without conditional image (for image-flux type or when no existing image)
          const defaultPrompt = `Create a new social media post image featuring ${characterName}, ${characterDescription}. The image should be on-topic and relevant to their expertise and personality. High quality, detailed, professional lighting, engaging composition that fits their brand and content style.`;
          finalPrompt = defaultPrompt;
          console.log('Using FLUX.1 Dev for initial image. Prompt:', finalPrompt);
          const base64Image = await imageGenerationService.generateInitialCharacterImage(
            characterName,
            characterDescription,
            defaultPrompt
          );
          imageUrl = await imageGenerationService.uploadImageToS3(base64Image, characterId);
          usedModel = 'black-forest-labs/FLUX.1-dev';
        }
      } else {
        // Fallback to base64 image if no characterId provided
        if (existingImageUrl && postType !== 'image-flux') {
          const defaultPrompt = `Create a new social media post image featuring ${characterName}, ${characterDescription}. The image should be on-topic and relevant to their expertise and personality. High quality, detailed, professional lighting, engaging composition that fits their brand and content style.`;
          finalPrompt = defaultPrompt;
          console.log('Using FLUX.1 Kontext without characterId. Prompt:', finalPrompt);
          imageUrl = await imageGenerationService.generateCharacterImage(
            characterName,
            characterDescription,
            defaultPrompt,
            existingImageUrl
          );
          usedModel = 'black-forest-labs/FLUX.1-kontext-dev';
        } else {
          const defaultPrompt = `Create a new social media post image featuring ${characterName}, ${characterDescription}. The image should be on-topic and relevant to their expertise and personality. High quality, detailed, professional lighting, engaging composition that fits their brand and content style.`;
          finalPrompt = defaultPrompt;
          console.log('Using FLUX.1 Dev without characterId. Prompt:', finalPrompt);
          imageUrl = await imageGenerationService.generateInitialCharacterImage(
            characterName,
            characterDescription,
            defaultPrompt
          );
          usedModel = 'black-forest-labs/FLUX.1-dev';
        }
      }
    }

    console.log('Final image generation results:', {
      imageUrl,
      usedModel,
      finalPrompt,
      imageUrlType: typeof imageUrl,
      imageUrlLength: imageUrl?.length
    });

    // Save the generated image as a post
    let post = null;
    try {
      console.log('Attempting to save post to database:', {
        type: postType,
        imageUrl,
        title: postPrompt || prompt || `Generated image of ${characterName}`,
        description: `Generated using ${usedModel}`,
        prompt: finalPrompt,
        userId,
        characterId: characterId || null
      });

      // Note: This will work after running prisma db push
      post = await prisma.post.create({
        data: {
          type: postType,
          imageUrl,
          title: postPrompt || prompt || `Generated image of ${characterName}`,
          description: `Generated using ${usedModel}`,
          prompt: finalPrompt,
          userId,
          characterId: characterId || null
        }
      });

      console.log('Post created successfully:', post);
    } catch (dbError) {
      console.error('Failed to save post to database:', dbError);
      console.warn('Database error details:', {
        error: dbError,
        message: dbError instanceof Error ? dbError.message : 'Unknown error',
        stack: dbError instanceof Error ? dbError.stack : undefined
      });
      // Continue without saving post if database isn't ready
    }

    return NextResponse.json({
      imageUrl,
      prompt: finalPrompt || prompt || `Professional headshot of ${characterName}, ${characterDescription}`,
      model: usedModel,
      steps,
      n,
      post // Include the created post if successful
    });

  } catch (error) {
    console.error('=== Image Generation API Error ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Full error object:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to generate image';
    let statusCode = 400;
    
    if (error instanceof Error) {
      if (error.message.includes('rate_limit') || error.message.includes('429')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
        statusCode = 429;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
        statusCode = 408;
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
        statusCode = 503;
      } else if (error.message.includes('500')) {
        errorMessage = 'Image generation service temporarily unavailable. Please try again.';
        statusCode = 500;
      } else if (error.message.includes('insufficient_quota')) {
        errorMessage = 'Insufficient quota. Please check your Together AI account.';
        statusCode = 402;
      } else if (error.message.includes('invalid_api_key')) {
        errorMessage = 'Invalid API key. Please check your configuration.';
        statusCode = 401;
      } else if (error.message.includes('FLUX.1 Kontext failed')) {
        errorMessage = 'Image generation failed, but fallback was attempted';
      } else if (error.message.includes('Invalid image format')) {
        errorMessage = 'Invalid condition image format provided';
      } else if (error.message.includes('No images generated')) {
        errorMessage = 'No images were generated by the AI model';
      } else {
        // Include the original error message for debugging
        errorMessage = `Image generation failed: ${error.message}`;
      }
    }
    
    console.error('Returning error response:', { errorMessage, statusCode });
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
} 