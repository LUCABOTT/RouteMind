
import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  Req,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { EvidenciasService } from './evidencias.service';
import { CrearEvidenciaDto } from './dto/crear-evidencias.dto';
import type { AuthenticatedRequest } from '../auth/guards/auth.guard';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

@Controller('evidencias')
export class EvidenciasController {
  constructor(
    private readonly evidenciasService: EvidenciasService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_FILE_SIZE,
      },
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Formato no permitido. Usa JPG, PNG o WEBP',
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  async crear(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CrearEvidenciaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user) {
      throw new BadRequestException(
        'No se encontró el usuario autenticado',
      );
    }

    return this.evidenciasService.crearEvidencia(
      dto,
      file,
      {
        id: req.user.id,
        role: req.user.role,
        conductorId: req.user.conductorId,
      },
    );
  }
}
