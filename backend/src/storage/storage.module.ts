
import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { StorageController } from './storage.controller';

@Module({
   controllers: [StorageController],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class StorageModule {}
