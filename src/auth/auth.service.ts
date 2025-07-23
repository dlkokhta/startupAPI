import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from '../user/user.service';
import { LoginUserDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
  ) {}

  async registerUser(createUserDto: CreateUserDto) {
    const userExist = await this.userService.findByEmail(createUserDto.email);
    if (userExist) throw new ConflictException('User already exists');
    const newUser = await this.userService.create(createUserDto);
    return newUser;
  }

  async loginUser(loginUserDto: LoginUserDto, ip?: string, userAgent?: string) {
    const userExist = await this.userService.findByEmail(loginUserDto.email);
    if (!userExist || !userExist.password) {
      throw new NotFoundException(
        'User cnanot be found, please register first or check your email address and password',
      );
    }

    const isValidPassword = await argon2.verify(
      userExist.password,
      loginUserDto.password,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const payload = {
      sub: userExist.id,
      email: userExist.email,
      role: userExist.role,
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Save refresh token in Session table (hashed)
    await this.prismaService.session.create({
      data: {
        userId: userExist.id,
        refreshToken: await argon2.hash(refreshToken),
        ip,
        userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    const { password, ...userWithoutPassword } = userExist;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken, // this can go in cookie
    };
  }
}
