import { Module, OnModuleInit } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { User } from './models/user.model';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    SequelizeModule.forFeature([User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [AuthController, UsersController],
  providers: [AuthService, UsersService, AuthGuard, RolesGuard],
  exports: [AuthGuard, RolesGuard, UsersService, AuthService],
})
export class AuthModule implements OnModuleInit {
  constructor(private readonly usersService: UsersService) {}

  async onModuleInit() {
    const email = process.env.SEED_SUPERADMIN_EMAIL;
    const password = process.env.SEED_SUPERADMIN_PASSWORD;
    if (!email && !password) return;
    if (!email || !password || password.length < 12) {
      throw new Error(
        'Configura SEED_SUPERADMIN_EMAIL y una SEED_SUPERADMIN_PASSWORD de al menos 12 caracteres.',
      );
    }
    await this.usersService.ensureSuperadmin(email, password);
  }
}
