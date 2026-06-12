import { AppDataSource } from '../../config/data-source';
import { User } from '../../entities/user/user.entity';
import { UserRole } from '../../declarations';
import bcrypt from 'bcrypt';

const userRepository = AppDataSource.getRepository(User);

interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

interface UpdateUserData {
  email?: string;
  password?: string;
  name?: string;
  role?: UserRole;
}

export const usersService = {
  async findAll(): Promise<User[]> {
    return userRepository.find({
      select: ['id', 'email', 'name', 'role', 'createdAt', 'updatedAt'],
      order: { id: 'ASC' },
    });
  },

  async findById(id: number): Promise<User | null> {
    return userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'name', 'role', 'createdAt', 'updatedAt'],
    });
  },

  async create(data: CreateUserData): Promise<User> {
    const existing = await userRepository.findOne({ where: { email: data.email } });
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = userRepository.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: data.role || 'observer',
    });

    return userRepository.save(user);
  },

  async update(id: number, data: UpdateUserData): Promise<User> {
    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    if (data.email && data.email !== user.email) {
      const existing = await userRepository.findOne({ where: { email: data.email } });
      if (existing) {
        throw new Error('Email already in use');
      }
      user.email = data.email;
    }

    if (data.password) {
      user.password = await bcrypt.hash(data.password, 10);
    }

    if (data.name) {
      user.name = data.name;
    }

    if (data.role) {
      user.role = data.role;
    }

    return userRepository.save(user);
  },

  async delete(id: number): Promise<void> {
    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    await userRepository.remove(user);
  },
};
