import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthCredentialsDto, RegisterDto } from './dto/auth.dto';
import { Public } from './decorators/public.decorator';
import type { AuthenticatedRequest } from './guards/auth.guard';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';

const TOKEN_COOKIE = 'routeMindToken';
const TOKEN_MAX_AGE = 8 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.register(dto);
    this.setTokenCookie(response, session.token);
    return { user: session.user };
  }

  @Public()
  @Post('login')
  async login(
    @Body() dto: AuthCredentialsDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(dto);
    this.setTokenCookie(response, session.token);
    return { user: session.user };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(TOKEN_COOKIE, this.cookieOptions());
    return { message: 'Sesión cerrada' };
  }

  @Get('me')
  async me(@Req() request: AuthenticatedRequest) {
    const user = await this.usersService.findById(request.user!.id);
    return { user: user && this.usersService.toSafeUser(user) };
  }

  private setTokenCookie(response: Response, token: string) {
    response.cookie(TOKEN_COOKIE, token, {
      ...this.cookieOptions(),
      maxAge: TOKEN_MAX_AGE,
    });
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };
  }
}
