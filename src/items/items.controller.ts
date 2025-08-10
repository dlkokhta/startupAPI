import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('items')
@Controller('items')
export class ItemsController {
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  findAll(@Req() req: Request) {
    return [
      { id: 1, name: 'Test Item 1' },
      { id: 2, name: 'Test Item 2' },
    ];
  }
}
