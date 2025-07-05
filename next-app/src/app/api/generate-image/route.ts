import { NextRequest, NextResponse } from 'next/server';
import { imageGenerationService } from '@/services/imageGenerationService';
import { generateImagePromptWithAI } from '@/services/aiService';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { 
      prompt, 
      postPrompt, // New parameter for post-specific prompt
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
      console.log('Condition image for final prompt:', existingImageUrl);
      const response = await imageGenerationService.generateImages({
        prompt: finalPrompt,
        steps,
        n: 1,
        conditionImage: existingImageUrl
      });
      imageUrl = response.images[0];
      usedModel = response.model;
    } else if (prompt) {
      // Fallback to original prompt logic
      console.log('Using original prompt:', prompt);
      console.log('Condition image for original prompt:', existingImageUrl);
      const response = await imageGenerationService.generateImages({
        prompt: prompt,
        steps,
        n: 1,
        conditionImage: existingImageUrl
      });
      imageUrl = response.images[0];
      usedModel = response.model;
    } else {
      // Generate character image with S3 upload
      if (characterId) {
        if (existingImageUrl) {
          // Use FLUX.1 Kontext with conditional image
          const defaultPrompt = `Create a new social media post image featuring ${characterName}, ${characterDescription}. The image should be on-topic and relevant to their expertise and personality. High quality, detailed, professional lighting, engaging composition that fits their brand and content style.`;
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
          // Generate initial image without conditional image
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
        if (existingImageUrl) {
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
        type: 'image',
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
          type: 'image',
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
    console.error('Image generation API error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to generate image';
    if (error instanceof Error) {
      if (error.message.includes('FLUX.1 Kontext failed')) {
        errorMessage = 'Image generation failed, but fallback was attempted';
      } else if (error.message.includes('Invalid image format')) {
        errorMessage = 'Invalid condition image format provided';
      } else if (error.message.includes('No images generated')) {
        errorMessage = 'No images were generated by the AI model';
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 