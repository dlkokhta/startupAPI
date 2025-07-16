import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { UsersModule } from '../users/users.module'; // if needed
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    UsersModule, // if you depend on users
    JwtModule.register({}), // configure JWT if needed
  ],
  providers: [AuthService, AuthResolver],
})
export class AuthModule {}
