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
import { GoogleRequest } from './types/google-request.type';
import { GoogleRegisterDto } from './dto/google-register.dto';
import { GoogleLoginDto } from './dto/google-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
  ) {}

  //google user login
  async loginGoogleUser(googleUserLogin: GoogleLoginDto) {
    const userExist = await this.userService.findByEmail(googleUserLogin.email);

    // Generate tokens
    const payload = {
      userId: userExist?.id,
      email: userExist?.email,
      role: userExist?.role,
    };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      // Default to 7d; override via JWT_REFRESH_EXPIRES_IN if you want shorter for testing
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    const hashedRefreshToken = await argon2.hash(refreshToken);

    await this.prismaService.session.create({
      data: {
        userId: userExist!.id,
        refreshToken: hashedRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      userExist,
      accessToken,
      refreshToken, // this can go in cookie
    };
  }

  //google user registration
  async registerGoogleUser(googleUserRegister: GoogleRegisterDto) {
    const userExist = await this.userService.findByEmail(
      googleUserRegister.email,
    );
    if (userExist) throw new ConflictException('User already exists');

    // Map Google DTO to CreateUserDto
    const createUserDto: CreateUserDto = {
      email: googleUserRegister.email,
      firstname: googleUserRegister.firstName || '',
      lastname: googleUserRegister.lastName || '',
      password: 'google-oauth-user', // placeholder, won't be used
      passwordRepeat: 'google-oauth-user',
    };

    const newUser = await this.userService.create(createUserDto);
    return newUser;
  }

  async findOrCreateGoogleUser(googleUser: any) {
    const existingUser = await this.userService.findByEmail(googleUser.email);

    if (existingUser) {
      console.log('User found, logging in...');
      return this.loginGoogleUser({ email: googleUser.email });
    }

    const newUser = await this.registerGoogleUser({
      email: googleUser.email,
      firstName: googleUser.firstName,
      lastName: googleUser.lastName,
      provider: 'google',
      googleId: googleUser.googleId,
      avatar: googleUser.avatar,
    });
    console.log('New user registered:', newUser);

    // After registration, log in the user and return tokens
    return this.loginGoogleUser({ email: newUser.email });
  }

  ///////////////////////////////////////////////////////////////////////////////////

  async registerUser(createUserDto: CreateUserDto) {
    console.log('Registering new user:', createUserDto);
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
      userId: userExist.id,
      email: userExist.email,
      role: userExist.role,
    };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      // Default to 7d; override via JWT_REFRESH_EXPIRES_IN if you want shorter for testing
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    const hashedRefreshToken = await argon2.hash(refreshToken);

    await this.prismaService.session.create({
      data: {
        userId: userExist.id,
        refreshToken: hashedRefreshToken,
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

  async refresh(refreshToken: string) {
    // 1. verify JWT
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 2. look up all sessions for this user and verify the refresh token hash
    const sessions = await this.prismaService.session.findMany({
      where: { userId: payload.userId },
    });

    let session: any = null;
    for (const s of sessions) {
      if (await argon2.verify(s.refreshToken, refreshToken)) {
        session = s;
        break;
      }
    }

    if (!session) {
      throw new UnauthorizedException('Refresh token not found');
    }

    // 3. check expiry
    if (new Date() > session.expiresAt) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // 4. generate new tokens
    const newPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
    const newAccess = this.jwtService.sign(newPayload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1m',
    });
    const newRefresh = this.jwtService.sign(newPayload, {
      secret: process.env.JWT_SECRET,
      // Default to 7d; override via env
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    // 5. rotate: update existing session in-place (safer than delete+create)
    console.log(`Rotating refresh token for session: ${session.id}`);
    await this.prismaService.session.update({
      where: { id: session.id },
      data: {
        refreshToken: await argon2.hash(newRefresh),

        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken: newAccess, refreshToken: newRefresh };
  }

  async logout(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      await this.prismaService.session.deleteMany({
        where: { userId: payload.userId },
      });
      return { message: 'Logged out successfully' };
    } catch {
      // Token invalid, but still return success (idempotent)
      return { message: 'Logged out successfully' };
    }
  }
}
