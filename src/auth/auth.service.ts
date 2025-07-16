import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async signup(signupDto: SignupDto) {
    const { firstname, lastname, email, password, displayName, avatar, phone } =
      signupDto;

    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const newUser = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstname: firstname || null,
          lastname: lastname || null,
          displayName: displayName || null,
          avatar: avatar || null,
          phone: phone || null,
        },
      });
      // Return user without password
      const { password: _, ...userResponse } = newUser;
      return {
        success: true,
        message: 'User registered successfully',
        user: userResponse,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to register user');
    }
  }
}
