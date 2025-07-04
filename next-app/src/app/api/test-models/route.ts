import { NextRequest, NextResponse } from 'next/server';
import { imageGenerationService } from '@/services/imageGenerationService';

export async function GET() {
  try {
    // Test with a simple default prompt
    const defaultPrompt = 'A professional headshot of a business person, high quality, detailed';
    
    console.log('Testing models with default prompt:', defaultPrompt);
    
    // Test all available models with better error handling
    const results = await imageGenerationService.testModels(defaultPrompt);

    // Group results by success/failure
    const successfulModels = results.filter(r => r.success);
    const failedModels = results.filter(r => !r.success);

    return NextResponse.json({
      prompt: defaultPrompt,
      results,
      summary: {
        totalModels: results.length,
        successfulModels: successfulModels.length,
        failedModels: failedModels.length,
        successfulModelNames: successfulModels.map(r => r.model),
        failedModelNames: failedModels.map(r => ({ model: r.model, error: r.error }))
      },
      recommendations: {
        bestModel: successfulModels.length > 0 ? successfulModels[0].model : null,
        fallbackModel: successfulModels.length > 1 ? successfulModels[1].model : null,
        workingModels: successfulModels.map(r => r.model)
      }
    });

  } catch (error) {
    console.error('Model testing API error:', error);
    return NextResponse.json(
      { error: 'Failed to test models' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, conditionImage } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Test all available models with better error handling
    const results = await imageGenerationService.testModels(prompt, conditionImage);

    // Group results by success/failure
    const successfulModels = results.filter(r => r.success);
    const failedModels = results.filter(r => !r.success);

    return NextResponse.json({
      results,
      summary: {
        totalModels: results.length,
        successfulModels: successfulModels.length,
        failedModels: failedModels.length,
        successfulModelNames: successfulModels.map(r => r.model),
        failedModelNames: failedModels.map(r => ({ model: r.model, error: r.error }))
      },
      recommendations: {
        bestModel: successfulModels.length > 0 ? successfulModels[0].model : null,
        fallbackModel: successfulModels.length > 1 ? successfulModels[1].model : null,
        workingModels: successfulModels.map(r => r.model)
      }
    });

  } catch (error) {
    console.error('Model testing API error:', error);
    return NextResponse.json(
      { error: 'Failed to test models' },
      { status: 500 }
    );
  }
} 