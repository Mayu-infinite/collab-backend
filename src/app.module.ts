import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [AuthModule, UsersModule, DocumentsModule],
})
export class AppModule {}
