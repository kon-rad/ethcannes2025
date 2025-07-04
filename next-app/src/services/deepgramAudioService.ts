import { createClient } from "@deepgram/sdk";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

export class DeepgramAudioService {
  private deepgram;
  private readonly DEFAULT_VOICE_ID = "aura-arcas-en";

  constructor() {
    this.deepgram = createClient(process.env.DEEPGRAM_API_KEY);
  }

  async generateAudio(text: string, voiceId: string = this.DEFAULT_VOICE_ID): Promise<string> {
    try {
      const truncatedText = text.slice(0, 1990);
      console.log('Starting audio generation with Deepgram', { text: truncatedText, voiceId });

      const response = await this.deepgram.speak.request(
        { text: truncatedText },
        {
          model: voiceId,
          encoding: "linear16",
          container: "wav",
        }
      );

      const stream = await response.getStream();
      if (stream) {
        const buffer = await this.getAudioBuffer(stream);
        const filePath = `output_${voiceId}.wav`;
        fs.writeFileSync(filePath, buffer);
        console.log('Audio file written to', filePath);
        return filePath;
      } else {
        throw new Error("Error generating audio: No stream available");
      }
    } catch (error) {
      console.error('Error generating audio with Deepgram', { error });
      throw error;
    }
  }

  private async getAudioBuffer(response: ReadableStream<Uint8Array>): Promise<Buffer> {
    const reader = response.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const dataArray = chunks.reduce(
      (acc, chunk) => Uint8Array.from([...acc, ...chunk]),
      new Uint8Array(0)
    );

    return Buffer.from(dataArray.buffer);
  }
}