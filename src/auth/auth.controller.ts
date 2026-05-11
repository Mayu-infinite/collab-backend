import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './auth.guard';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('google')
  googleLogin(@Res() res: Response) {
    return res.redirect(this.authService.getGoogleAuthUrl());
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    if (error || !code) {
      return res.redirect(
        this.authService.getGoogleCallbackErrorRedirect(
          error || 'Google sign-in was cancelled',
        ),
      );
    }

    try {
      const auth = await this.authService.loginWithGoogle(code);

      return res.redirect(
        this.authService.getGoogleCallbackRedirect(auth.accessToken),
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Google sign-in failed';

      return res.redirect(
        this.authService.getGoogleCallbackErrorRedirect(message),
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: AuthenticatedRequest) {
    return req.user;
  }
}
