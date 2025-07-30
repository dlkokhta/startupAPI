import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.OK)
  public async registerUser(@Body() createUserDto: CreateUserDto) {
    console.log('Registering user:', createUserDto);
    return this.authService.registerUser(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  public async loginUser(
    @Body() loginUserDto: LoginUserDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response, // allows Nest to keep sending JSON
  ) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    const { refreshToken, ...result } = await this.authService.loginUser(
      loginUserDto,
      ip,
      userAgent,
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return result; // JSON body: { user, accessToken }
  }

  // @Post('refresh')
  // @HttpCode(HttpStatus.OK)
  // public async refreshTokens(
  //   @Req() req: Request,
  //   @Res({ passthrough: true }) res: Response,
  // ) {
  //   const refreshToken = req.cookies['refreshToken'];
  //   if (!refreshToken) throw new UnauthorizedException('No refresh token');
  //   const tokens = await this.authService.refresh(refreshToken);
  //   res.cookie('refreshToken', tokens.refreshToken, {
  //     httpOnly: true,
  //     secure: process.env.NODE_ENV === 'production',
  //     sameSite: 'lax',
  //     path: '/auth/refresh',
  //     maxAge: 7 * 24 * 60 * 60 * 1000,
  //   });
  //   return { accessToken: tokens.accessToken };
  // }

  // @Post('logout')
  // @HttpCode(HttpStatus.OK)
  // public async logout(
  //   @Req() req: Request,
  //   @Res({ passthrough: true }) res: Response,
  // ) {
  //   const refreshToken = req.cookies['refreshToken'];

  //   if (refreshToken) {
  //     await this.authService.logout(refreshToken);
  //   }

  //   res.clearCookie('refreshToken', {
  //     path: '/auth', // Match the path used when setting
  //   });

  //   return { message: 'Logged out successfully' };
  // }
}
