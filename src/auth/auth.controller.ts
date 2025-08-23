import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  Get,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login.dto';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { ApiBody } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Google OAuth Login - Step 1: Redirect to Google
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth() {
    console.log('Redirecting to Google for authentication');
    // This will redirect to Google
  }

  // Google OAuth Login - Step 2: Handle callback from Google
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    try {
      const googleUser = req.user;
      const result = await this.authService.findOrCreateGoogleUser(googleUser);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Send only the access token to frontend
      return res.redirect(
        `http://localhost:5173/auth/success?token=${result.accessToken}`,
      );
    } catch (error) {
      const errorUrl = `http://localhost:5173/auth/error?status=error&message=${encodeURIComponent(error.message)}`;
      return res.redirect(errorUrl);
    }
  }

  // Get user profile
  @Get('profile')
  getProfile(@Req() req) {
    return req.user;
  }

  @Post('signup')
  @HttpCode(HttpStatus.OK)
  public async registerUser(@Body() createUserDto: CreateUserDto) {
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

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  public async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refreshToken'];
    if (!refreshToken) throw new UnauthorizedException('No refresh token');

    const tokens = await this.authService.refresh(refreshToken);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  public async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refreshToken'];

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    res.clearCookie('refreshToken', {
      path: '/',
    });

    return { message: 'Logged out successfully' };
  }
}
