import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Find user by ID (Clerk user ID)
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        invitation: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  // Find user by email
  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        invitation: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  // Get all users
  async findAll() {
    return this.prisma.user.findMany({
      include: {
        invitation: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Batch lookup users by IDs
  async findByIds(ids: string[]) {
    return this.prisma.user.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      include: {
        invitation: true,
      },
    });
  }
}
