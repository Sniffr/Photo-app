import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { UploadResult } from '../interfaces/storage-config.interface';

@Injectable()
export class StorageService {
  private s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<UploadResult> {
    const key = `${Date.now()}-${file.originalname}`;

    const params: AWS.S3.PutObjectRequest = {
      Bucket: process.env.AWS_S3_BUCKET || '',
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    const uploadResult = await this.s3.upload(params).promise();

    return {
      url: uploadResult.Location,
      key: uploadResult.Key,
    };
  }

  async deleteFile(key: string): Promise<void> {
    const params: AWS.S3.DeleteObjectRequest = {
      Bucket: process.env.AWS_S3_BUCKET || '',
      Key: key,
    };

    await this.s3.deleteObject(params).promise();
  }
}
