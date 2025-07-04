import Together from "together-ai";
import { DEFAULT_SUMMARIZATION_MODEL } from '../utils/aiModels';

const together = new Together();

interface AIAnalysisInput {
    systemPrompt: string;
    userMessage: string;
    modelName?: string;
}

interface ImagePromptInput {
    name: string;
    description: string;
}

export async function summarizeWithAI({ 
    systemPrompt, 
    userMessage, 
    modelName = DEFAULT_SUMMARIZATION_MODEL.apiModelString 
}: AIAnalysisInput): Promise<string> {
    try {
        const response = await together.chat.completions.create({
            model: modelName,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
        });

        if (!response.choices?.[0]?.message?.content) {
            throw new Error('No analysis generated');
        }

        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error in AI analysis:', error);
        throw error;
    }
} 

export async function generateImagePrompt({ name, description }: ImagePromptInput): Promise<string> {
    const systemPrompt = `You are an expert at writing image generation prompts. Create a detailed prompt for a professional headshot of the character described below. Focus on facial features, expression, and style.`;
    const userMessage = `Character name: ${name}\nDescription: ${description}\n\nWrite a detailed image generation prompt for a professional headshot of this character.`;

    return summarizeWithAI({
        systemPrompt,
        userMessage
    });
}

export async function generateStableDiffusionImage(prompt: string, model: string): Promise<string> {
    try {
        const url = 'https://api.together.xyz/v1/images/generations';
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'authorization': `Bearer ${process.env.TOGETHER_API_KEY}`
            },

            body: JSON.stringify({
                model: model,
                prompt,
                steps: 20,
                n: 1,
                height: 1024,
                width: 1024
            })
        });

        const data = await response.json();
        
        if (!data.output?.images?.[0]) {
            throw new Error('No image URL generated');
        }

        return data.output.images[0];
    } catch (error) {
        console.error('Error generating Flux image:', error);
        throw error;
    }
} 