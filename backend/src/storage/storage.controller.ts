
import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CloudinaryService } from './cloudinary.service';

@Controller('storage')
export class StorageController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post('test-upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
      },
      fileFilter: (req, file, callback) => {
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
        ];

        if (!allowedTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Formato no permitido. Utiliza JPG, PNG o WEBP.',
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  async testUpload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(
        'Debes seleccionar una fotografía.',
      );
    }

    const result = await this.cloudinaryService.uploadImage(
      file.buffer,
    );

    return {
      message: 'Fotografía subida correctamente a Cloudinary',
      image: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height,
      },
    };
  }
}
