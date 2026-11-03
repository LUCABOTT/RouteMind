import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from './decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto, UpdateUserStatusDto } from './dto/update-user.dto';
import { UserRole } from './roles';
import { UsersService } from './users.service';

@Controller('users')
@Roles(UserRole.SUPERADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  listar() {
    return this.usersService.list();
  }

  @Post()
  async crear(@Body() dto: CreateUserDto) {
    const user = await this.usersService.register(
      dto.name,
      dto.email,
      dto.password,
      dto.role,
    );
    return this.usersService.toSafeUser(user);
  }

  @Patch(':id/role')
  cambiarRol(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateRole(id, dto.role);
  }

  @Patch(':id/status')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateActive(id, dto.active);
  }

  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.delete(id);
  }
}
