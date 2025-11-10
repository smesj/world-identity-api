import { Controller, Get, Post, Body, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { InvitationsService } from './invitations.service';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  create(
    @Body('createdById') createdById?: string,
    @Body('expiresInDays') expiresInDays?: number,
  ) {
    return this.invitationsService.create(createdById, expiresInDays);
  }

  @Get()
  findAll() {
    return this.invitationsService.findAll();
  }

  @Get('validate/:code')
  validate(@Param('code') code: string) {
    return this.invitationsService.validate(code);
  }

  @Post('use')
  use(@Body('code') code: string) {
    return this.invitationsService.use(code);
  }

  @Get(':code/qr')
  async getQRCode(@Param('code') code: string, @Res() res: Response) {
    const qrBuffer = await this.invitationsService.generateQRCode(code);
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': qrBuffer.length,
    });
    res.send(qrBuffer);
  }

  @Get(':code')
  findByCode(@Param('code') code: string) {
    return this.invitationsService.findByCode(code);
  }
}
