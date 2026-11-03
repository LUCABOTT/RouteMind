import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { hash } from 'bcryptjs';
import { User } from './models/user.model';
import { UserRole } from './roles';

export type SafeUser = Pick<
  User,
  'id' | 'email' | 'name' | 'role' | 'active' | 'createdAt'
>;

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({
      where: { email: email.trim().toLowerCase() },
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.userModel.findByPk(id);
  }

  async register(
    name: string,
    email: string,
    password: string,
    role: UserRole = UserRole.PLANIFICADOR,
  ): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();
    if (await this.findByEmail(normalizedEmail)) {
      throw new ConflictException('Ya existe una cuenta con ese correo');
    }

    try {
      return await this.userModel.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: await hash(password, 12),
        role,
        active: true,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'SequelizeUniqueConstraintError'
      ) {
        throw new ConflictException('Ya existe una cuenta con ese correo');
      }
      throw error;
    }
  }

  async ensureSuperadmin(email: string, password: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const existingSuperadmin = await this.userModel.findOne({
      where: { role: UserRole.SUPERADMIN },
    });
    if (existingSuperadmin) return;

    await this.userModel.create({
      email: normalizedEmail,
      name: 'Superadministrador',
      passwordHash: await hash(password, 12),
      role: UserRole.SUPERADMIN,
      active: true,
    });
  }

  async list(): Promise<SafeUser[]> {
    return this.userModel.findAll({
      attributes: ['id', 'email', 'name', 'role', 'active', 'createdAt'],
      order: [['createdAt', 'DESC']],
    }) as Promise<SafeUser[]>;
  }

  async updateRole(id: number, role: UserRole): Promise<SafeUser> {
    const user = await this.userModel.findByPk(id);
    if (!user) throw new NotFoundException('No existe el usuario');
    if (user.role === UserRole.SUPERADMIN) {
      throw new ConflictException('No se puede modificar al SUPERADMIN');
    }
    if (role === UserRole.CONDUCTOR) {
      throw new ConflictException(
        'Crea la cuenta desde el registro del conductor para vincularla correctamente',
      );
    }
    await user.update({ role, conductorId: null });
    return this.toSafeUser(user);
  }

  async updateActive(id: number, active: boolean): Promise<SafeUser> {
    const user = await this.userModel.findByPk(id);
    if (!user) throw new NotFoundException('No existe el usuario');
    if (user.role === UserRole.SUPERADMIN) {
      throw new ConflictException('No se puede desactivar al SUPERADMIN');
    }
    await user.update({ active });
    return this.toSafeUser(user);
  }

  async delete(id: number): Promise<{ message: string }> {
    const user = await this.userModel.findByPk(id);
    if (!user) throw new NotFoundException('No existe el usuario');
    if (user.role === UserRole.SUPERADMIN) {
      throw new ConflictException('No se puede eliminar al SUPERADMIN');
    }
    await user.destroy();
    return { message: 'Usuario eliminado' };
  }

  toSafeUser(user: User): SafeUser {
    const { id, email, name, role, active, createdAt } = user;
    return { id, email, name, role, active, createdAt };
  }
}
