import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AppDataSource } from '../../config/data-source';
import { User } from '../../entities/user/user.entity';
import { JwtPayload, UserRole } from '../../declarations';
import { config } from '../../config';

const userRepository = AppDataSource.getRepository(User);

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export const userAuthService = {
  async register(data: RegisterDto): Promise<User> {
    const existingUser = await userRepository.findOne({ where: { email: data.email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = userRepository.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: data.role || 'observer',
    });

    await userRepository.save(user);
    return user;
  },

  async login(data: LoginDto): Promise<TokenPair> {
    const user = await userRepository.findOne({ where: { email: data.email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    return this.generateTokens(user);
  },

  async refresh(refreshToken: string): Promise<TokenPair> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as JwtPayload & { type: string };
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      const user = await userRepository.findOne({ where: { id: decoded.userId } });
      if (!user) {
        throw new Error('User not found');
      }

      return this.generateTokens(user);
    } catch {
      throw new Error('Invalid refresh token');
    }
  },

  async logout(_refreshToken: string): Promise<void> {
    // Refresh tokens are JWT-based and do not rely on per-process memory.
  },

  generateTokens(user: User): TokenPair {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessOptions: SignOptions = { expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'] };
    const refreshOptions: SignOptions = { expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'] };

    const accessToken = jwt.sign(payload, config.jwt.secret, accessOptions);
    const refreshToken = jwt.sign({ ...payload, type: 'refresh' }, config.jwt.secret, refreshOptions);

    return { accessToken, refreshToken };
  },

  async validateToken(token: string): Promise<JwtPayload> {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    return decoded;
  },

  async getUserById(id: number): Promise<User | null> {
    return userRepository.findOne({ where: { id } });
  },
};
