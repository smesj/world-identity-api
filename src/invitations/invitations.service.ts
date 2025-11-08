import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as QRCode from 'qrcode';

@Injectable()
export class InvitationsService {
  constructor(private prisma: PrismaService) {}

  // Generate a new invitation code
  async create(createdById?: string, email?: string, expiresInDays?: number) {
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    return this.prisma.invitation.create({
      data: {
        email,
        createdById,
        expiresAt,
      },
    });
  }

  // Validate an invitation code
  async validate(code: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { code },
      include: { usedBy: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation code not found');
    }

    // Check if expired
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation code has expired');
    }

    // Check if max uses reached
    if (invitation.usesCount >= invitation.maxUses) {
      throw new BadRequestException('Invitation code has reached maximum uses');
    }

    return {
      valid: true,
      invitation: {
        id: invitation.id,
        code: invitation.code,
        email: invitation.email,
        usesRemaining: invitation.maxUses - invitation.usesCount,
      },
    };
  }

  // Use an invitation code (link to a user)
  async use(code: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { code },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation code not found');
    }

    // Validate before use
    await this.validate(code);

    // Check if user already used this code
    const existingUser = await this.prisma.user.findFirst({
      where: {
        id: userId,
        invitationId: invitation.id,
      },
    });

    if (existingUser) {
      throw new BadRequestException('User has already used this invitation code');
    }

    // Update user with invitation
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        invitationId: invitation.id,
      },
    });

    // Increment uses count
    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        usesCount: { increment: 1 },
      },
    });

    return { success: true, message: 'Invitation code used successfully' };
  }

  // Get all invitations (admin only)
  async findAll() {
    return this.prisma.invitation.findMany({
      include: {
        usedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get invitation by code
  async findByCode(code: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { code },
      include: {
        usedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    return invitation;
  }

  // Generate QR code for invitation
  async generateQRCode(code: string): Promise<Buffer> {
    // Verify invitation exists
    await this.findByCode(code);

    // Generate signup URL with invite code
    const signupUrl = `https://footy.smesj.world/signup?invite=${code}`;

    // Generate QR code as buffer (PNG image)
    const qrBuffer = await QRCode.toBuffer(signupUrl, {
      type: 'png',
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M',
    });

    return qrBuffer;
  }
}
