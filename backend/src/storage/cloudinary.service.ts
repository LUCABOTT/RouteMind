
import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Faltan las credenciales de Cloudinary');
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  async uploadImage(
    buffer: Buffer,
    folder = 'routemind/evidencias',
  ): Promise<UploadApiResponse> {
    try {
      return await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            unique_filename: true,
            overwrite: false,
          },
          (error, result) => {
            if (error) {
              reject(error);
              return;
            }

            if (!result) {
              reject(new Error('Cloudinary no devolvió resultados'));
              return;
            }

            resolve(result);
          },
        );

        stream.end(buffer);
      });
    } catch (error) {
      console.error('Error al subir imagen a Cloudinary:', error);

      throw new InternalServerErrorException(
        'No se pudo almacenar la fotografía',
      );
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result !== 'ok' && result.result !== 'not found') {
        throw new Error('Cloudinary no pudo eliminar la imagen');
      }
    } catch (error) {
      console.error('Error al eliminar imagen:', error);

      throw new InternalServerErrorException(
        'No se pudo eliminar la fotografía',
      );
    }
  }
}
