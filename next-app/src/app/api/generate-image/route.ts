import { NextRequest, NextResponse } from 'next/server';
import { imageGenerationService } from '@/services/imageGenerationService';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { 
      prompt, 
      characterId,
      characterName, 
      characterDescription, 
      existingImageUrl,
      steps = 28, 
      n = 1,
      userId // Add userId to save posts
    } = await request.json();

    if (!prompt && (!characterName || !characterDescription)) {
      return NextResponse.json(
        { error: 'Either prompt or characterName + characterDescription are required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required to save the generated image as a post' },
        { status: 400 }
      );
    }

    // Validate prompt if provided
    if (prompt) {
      const validation = imageGenerationService.validatePrompt(prompt);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }
    }

    let imageUrl: string;
    let usedModel: string = 'unknown';
    let finalPrompt: string = '';

    if (prompt) {
      // Generate image with custom prompt
      finalPrompt = prompt;
      console.log('Using custom prompt:', finalPrompt);
      const response = await imageGenerationService.generateImages({
        prompt: finalPrompt,
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
          finalPrompt = `Professional headshot of ${characterName}, ${characterDescription}, high quality, detailed, professional lighting, studio background`;
          console.log('Using FLUX.1 Kontext with condition image. Prompt:', finalPrompt);
          imageUrl = await imageGenerationService.generateAndUploadCharacterImage(
            characterId,
            characterName,
            characterDescription,
            prompt,
            existingImageUrl
          );
          usedModel = 'black-forest-labs/FLUX.1-kontext-dev'; // This might have fallen back
        } else {
          // Generate initial image without conditional image
          finalPrompt = `Professional headshot of ${characterName}, ${characterDescription}, high quality, detailed, professional lighting, studio background`;
          console.log('Using FLUX.1 Dev for initial image. Prompt:', finalPrompt);
          const base64Image = await imageGenerationService.generateInitialCharacterImage(
            characterName,
            characterDescription,
            prompt
          );
          imageUrl = await imageGenerationService.uploadImageToS3(base64Image, characterId);
          usedModel = 'black-forest-labs/FLUX.1-dev';
        }
      } else {
        // Fallback to base64 image if no characterId provided
        if (existingImageUrl) {
          finalPrompt = `Professional headshot of ${characterName}, ${characterDescription}, high quality, detailed, professional lighting, studio background`;
          console.log('Using FLUX.1 Kontext without characterId. Prompt:', finalPrompt);
          imageUrl = await imageGenerationService.generateCharacterImage(
            characterName,
            characterDescription,
            prompt,
            existingImageUrl
          );
          usedModel = 'black-forest-labs/FLUX.1-kontext-dev'; // This might have fallen back
        } else {
          finalPrompt = `Professional headshot of ${characterName}, ${characterDescription}, high quality, detailed, professional lighting, studio background`;
          console.log('Using FLUX.1 Dev without characterId. Prompt:', finalPrompt);
          imageUrl = await imageGenerationService.generateInitialCharacterImage(
            characterName,
            characterDescription,
            prompt
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
        title: prompt || `Generated image of ${characterName}`,
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
          title: prompt || `Generated image of ${characterName}`,
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
      prompt: prompt || `Professional headshot of ${characterName}, ${characterDescription}`,
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