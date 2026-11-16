import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from '../auth/auth.module';
import { User } from '../auth/models/user.model';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [AuthModule, SequelizeModule.forFeature([User])],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
