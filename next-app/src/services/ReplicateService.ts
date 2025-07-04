import Replicate from 'replicate';

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export class ReplicateService {
    async faceSwap(targetImageURL: string, sourceImageURL: string): Promise<string> {
        console.log('Starting face swap process with inputs:', { 
            sourceImageURL, 
            targetImageURL,
        });

        // Create the prediction
        const prediction = await replicate.predictions.create({
            version: "cff87316e31787df12002c9e20a78a017a36cb31fde9862d8dedd15ab29b7288",
            input: {
                local_source: sourceImageURL,
                local_target: targetImageURL
            }
        });
        
        console.log('Prediction created with ID:', prediction.id);

        // Wait for the prediction to complete
        const output = await this.waitForPrediction(prediction.id);
        console.log('output replicate: ', output);
        

        // Get the swapped image URL from the response
        const swappedImageURL = (output as any).image;
        console.log('🖼️ Received swapped image URL:', swappedImageURL.substring(0, 50) + '...');

        return swappedImageURL;
    }

    private async waitForPrediction(predictionId: string): Promise<any> {
        while (true) {
            const prediction = await replicate.predictions.get(predictionId);
            
            if (prediction.status === 'succeeded') {
                return prediction.output;
            }
            
            if (prediction.status === 'failed') {
                throw new Error('Face swap prediction failed');
            }

            // Wait before checking again
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
} 