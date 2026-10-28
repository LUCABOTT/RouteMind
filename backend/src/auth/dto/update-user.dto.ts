import { IsBoolean, IsEnum } from 'class-validator';
import { UserRole } from '../roles';

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}

export class UpdateUserStatusDto {
  @IsBoolean()
  active: boolean;
}
