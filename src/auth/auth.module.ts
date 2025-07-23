import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
  imports: [
    UserModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your_default_jwt_secret',
      signOptions: { expiresIn: '15m' },
    }),
  ],
})
export class AuthModule {}
