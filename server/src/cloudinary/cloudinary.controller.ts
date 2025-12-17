import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('Upload')
@Controller('upload')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post()
  @ApiOperation({ summary: 'Upload 1 file ảnh' })
  @ApiConsumes('multipart/form-data') // Báo cho Swagger biết đây là upload file
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file')) // 'file' là tên key trong form-data
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Không có file nào được tải lên');
    }

    // Gọi service để upload
    const result = await this.cloudinaryService.uploadFile(file);

    // Trả về URL của ảnh
    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  }
}
