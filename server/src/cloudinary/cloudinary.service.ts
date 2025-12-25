import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  // Hàm upload file
  async uploadFile(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'vlu-renting' }, // Tên folder trên Cloudinary
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      // Biến đổi buffer thành stream để upload
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  // Hàm upload nhiều file
  async uploadMultipleFiles(files: Express.Multer.File[]) {
    // Sử dụng Promise.all để upload đồng thời nhiều file
    const uploadPromises = files.map((file) => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }
}
