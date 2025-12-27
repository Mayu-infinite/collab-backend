import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(user: { id: string }) {
    return this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        createdAt: true,
        // ❌ DO NOT select `name` until Prisma client is regenerated
      },
    });
  }
}
