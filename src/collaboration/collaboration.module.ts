import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { DocumentsModule } from "../documents/documents.module";
import { CollabGateway } from "./collab.gateway";
import { CollabService } from "./collab.service";

@Module({
  imports: [AuthModule, DocumentsModule],
  providers: [CollabGateway, CollabService],
})
export class CollaborationModule {}
