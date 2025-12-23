import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(user: any) {
    return this.prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });
  }
}
