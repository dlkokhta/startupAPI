import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { userRegistration } from './dto/userRegistration.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async register(dto: userRegistration) {
    const { name, email, password } = dto;
    console.log(name, email, password);

    const existUser = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (existUser) {
      throw new ConflictException('User with this email already registered');
    }

    const user = await this.prismaService.user.create({
      data: {
        name,
        email,
        password,
      },
    });
    return user;
  }
}
