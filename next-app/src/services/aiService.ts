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

export async function generateImagePromptWithAI({
    characterName,
    characterDescription,
    postPrompt,
    searchResults
}: {
    characterName: string;
    characterDescription: string;
    postPrompt?: string;
    searchResults: string;
}): Promise<string> {
    const systemPrompt = `You are an expert at writing image generation prompts for social media content. 
Your task is to generate a beautiful, detailed image prompt that will create an engaging visual post.

IMPORTANT REQUIREMENTS:
1. The generated image MUST keep the user's face/character consistent and recognizable
2. The scene should represent the content from the post prompt
3. The image should be on-topic and relevant to the character's expertise
4. Make it visually appealing and suitable for social media
5. Include details about lighting, composition, style, and mood
6. Ensure the character's face remains prominent and well-lit

Return ONLY the image generation prompt. Do not include any explanations or additional text.`;

    const userMessage = `
Character Information:
- Name: ${characterName}
- Description: ${characterDescription}

Post Content: ${postPrompt || 'Generate an engaging social media post image'}

Current Search Results/Context:
${searchResults}

Based on this information, create a detailed image generation prompt that will:
1. Keep ${characterName}'s face consistent and recognizable
2. Represent the scene/content from the post prompt
3. Be visually appealing and on-topic
4. Work well for social media

Generate the image prompt:`;

    return summarizeWithAI({
        systemPrompt,
        userMessage,
        modelName: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo'
    });
} 