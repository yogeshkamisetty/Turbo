import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() req: { email: string; pass: string }) {
    const user = await this.authService.validateUser(req.email, req.pass);
    return this.authService.login(user);
  }
}
