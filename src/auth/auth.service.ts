import { ConflictException, Injectable } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';

import { hash } from 'argon2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_ACCESS_TOKEN_TTL: string;
  private readonly JWT_REFRESH_TOKEN_TTL: string;

  constructor(
    // private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.JWT_SECRET = configService.getOrThrow<string>('JWT_SECRET');
    this.JWT_ACCESS_TOKEN_TTL = configService.getOrThrow<string>(
      'JWT_ACCESS_TOKEN_TTL',
    );
    this.JWT_REFRESH_TOKEN_TTL = configService.getOrThrow<string>(
      'JWT_REFRESH_TOKEN_TTL',
    );
  }

  async register() {
    // const { name, email, password } = dto;
    // console.log(name, email, password);
    // const existUser = await this.prismaService.user.findUnique({
    //   where: {
    //     email,
    //   },
    // });
    // if (existUser) {
    //   throw new ConflictException('User with this email already registered');
    // }
    // const user = await this.prismaService.user.create({
    //   data: {
    //     name,
    //     email,
    //     password: await hash(password),
    //   },
    // });
    // return user;
  }
}
