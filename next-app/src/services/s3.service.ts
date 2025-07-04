import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

export class S3Service {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    if (!process.env.S3_UPLOAD_KEY || !process.env.S3_UPLOAD_SECRET || !process.env.S3_UPLOAD_BUCKET) {
      throw new Error('S3 environment variables are not properly configured');
    }

    this.s3Client = new S3Client({
      region: process.env.S3_UPLOAD_REGION || 'us-west-2',
      credentials: {
        accessKeyId: process.env.S3_UPLOAD_KEY,
        secretAccessKey: process.env.S3_UPLOAD_SECRET,
      },
    });
    this.bucket = process.env.S3_UPLOAD_BUCKET;
  }

  async uploadFile(filePath: string, key: string, contentType?: string): Promise<string> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found at path: ${filePath}`);
      }

      const fileContent = fs.readFileSync(filePath);

      // Determine content type from file extension if not provided
      const detectedContentType = contentType || this.getContentTypeFromPath(filePath);

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: fileContent,
          ContentType: detectedContentType,
        })
      );

      // Return the S3 URL
      return `https://${this.bucket}.s3.${process.env.S3_UPLOAD_REGION || 'us-west-2'}.amazonaws.com/${key}`;
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw error;
    } finally {
      // Clean up local file
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up local file: ${filePath}`);
        }
      } catch (error) {
        console.error('Error cleaning up local file:', error);
      }
    }
  }

  // Helper method to determine content type from file extension
  private getContentTypeFromPath(filePath: string): string {
    const extension = path.extname(filePath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
    };

    return contentTypes[extension] || 'application/octet-stream';
  }

  async uploadBuffer(buffer: Buffer, key: string, contentType: string): Promise<string> {
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      );

      // Return the S3 URL
      return `https://${this.bucket}.s3.${process.env.S3_UPLOAD_REGION || 'us-west-2'}.amazonaws.com/${key}`;
    } catch (error) {
      console.error('Error uploading buffer to S3:', error);
      throw error;
    }
  }

  async deleteObject(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      })
    );
  }
}