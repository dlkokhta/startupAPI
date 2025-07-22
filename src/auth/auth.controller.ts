import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('signup')
  @HttpCode(HttpStatus.OK)
  public async registerUser(@Body() createUserDto: CreateUserDto) {
    console.log('Registering user:', createUserDto);
    return this.authService.registerUser(createUserDto);
  }
}
