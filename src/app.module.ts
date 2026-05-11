import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DocumentsModule } from './documents/documents.module';
import { CollaborationModule } from './collaboration/collaboration.module';

@Module({
  imports: [AuthModule, UsersModule, DocumentsModule, CollaborationModule,],
})
export class AppModule {}
