import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../auth/dto/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { hash } from 'argon2';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  public async findByEmail(email: string) {
    return this.prismaService.user.findUnique({
      where: { email },
    });
  }

  public async create(createUserDto: CreateUserDto) {
    const { passwordRepeat, password, ...rest } = createUserDto;
    const hashedPassword = await hash(password);
    return this.prismaService.user.create({
      data: { password: hashedPassword, ...rest },
    });
  }

  public async findById(id: string) {
    return this.prismaService.user.findUnique({
      where: { id },
    });
  }
}
