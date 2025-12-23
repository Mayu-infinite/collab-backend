import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // 👈 REQUIRED
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
