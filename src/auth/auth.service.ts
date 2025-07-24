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

  // async refresh(refreshToken: string) {
  //   // 1. verify JWT
  //   let payload: any;
  //   try {
  //     payload = this.jwtService.verify(refreshToken);
  //   } catch {
  //     throw new UnauthorizedException('Invalid refresh token');
  //   }

  //   // 2. look up the hashed token in the Session table
  //   const session = await this.prismaService.session.findFirst({
  //     where: { userId: payload.sub },
  //   });
  //   if (
  //     !session ||
  //     !(await argon2.verify(session.refreshToken, refreshToken))
  //   ) {
  //     throw new UnauthorizedException('Refresh token not found');
  //   }

  //   // 3. optional: check expiry
  //   if (new Date() > session.expiresAt) {
  //     throw new UnauthorizedException('Refresh token expired');
  //   }

  //   // 4. generate new tokens
  //   const newPayload = {
  //     sub: payload.sub,
  //     email: payload.email,
  //     role: payload.role,
  //   };
  //   const newAccess = this.jwtService.sign(newPayload, { expiresIn: '15m' });
  //   const newRefresh = this.jwtService.sign(newPayload, { expiresIn: '7d' });

  //   // 5. rotate: delete old session, create new one
  //   await this.prismaService.session.delete({ where: { id: session.id } });
  //   await this.prismaService.session.create({
  //     data: {
  //       userId: payload.sub,
  //       refreshToken: await argon2.hash(newRefresh),
  //       expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  //     },
  //   });

  //   return { accessToken: newAccess, refreshToken: newRefresh };
  // }

  // async logout(refreshToken: string) {
  //   try {
  //     const payload = this.jwtService.verify(refreshToken);
  //     await this.prismaService.session.deleteMany({
  //       where: { userId: payload.sub },
  //     });
  //     return { message: 'Logged out successfully' };
  //   } catch {
  //     // Token invalid, but still return success (idempotent)
  //     return { message: 'Logged out successfully' };
  //   }
  // }
}
