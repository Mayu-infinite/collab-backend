import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Param,
  Put,
  Delete,
  Patch,
} from "@nestjs/common";
import { Request } from "express";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/auth.guard";
import { DocumentsService } from "./documents.service";

@Controller("documents")
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) { }

  // ✅ CREATE DOCUMENT (ONLY FOR LOGGED-IN USER)
  @Post()
  createDocument(
    @Req() req: Request & { user: { id: string } },
    @Body() body: { title: string; content?: string },
  ) {
    return this.documentsService.createDocument(
      req.user.id,
      body.title,
      body.content ?? "",
    );
  }

  // ✅ GET ONLY MY DOCUMENTS
  @Get()
  getMyDocuments(@Req() req: Request & { user: { id: string } }) {
    return this.documentsService.getMyDocuments(req.user.id);
  }

  // ✅ GET SINGLE DOCUMENT (OWNER ONLY)
  @Get(":id")
  getDocumentById(
    @Param("id") id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.documentsService.getDocumentById(
      id,
      req.user.id, // ✅ FIXED (NOT sub)
    );
  }

  // ✅ UPDATE DOCUMENT (OWNER ONLY)
  @Put(":id")
  updateDocument(
    @Param("id") id: string,
    @Req() req: Request & { user: { id: string } },
    @Body() body: { title?: string; content?: string },
  ) {
    return this.documentsService.updateDocument(
      id,
      req.user.id, // ✅ FIXED
      body.title,
      body.content,
    );
  }

  @Delete(":id")
  deleteDocument(
    @Param("id") id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.documentsService.deleteDocument(
      id,
      req.user.id,
    );
  }

  @Post(":id/collaborate")
  enableCollaboration(
    @Param("id") id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.documentsService.enableCollaboration(
      id,
      req.user.id
    )
  }

  @Delete(":id/collaborate")
  disableCollaboration(
    @Param("id") id: string,
    @Req() req: Request & { user: { id: string } }
  ) {
    return this.documentsService.disableCollaboration(
      id,
      req.user.id
    )
  }

  @Post("join/:inviteCode")
  joinCollaboration(
    @Param("inviteCode") inviteCode: string,
    @Req() req: Request & { user: { id: string } }
  ) {
    return this.documentsService.joinCollaboration(
      inviteCode,
      req.user.id
    )
  }

  @Patch(":id/members/:memberId")
  updateMemberRole(
    @Param("id") id: string,
    @Param("memberId") memberId: string,
    @Req() req: Request & { user: { id: string } },
    @Body() body: { role: Role },
  ) {
    return this.documentsService.updateMemberRole(
      id,
      req.user.id,
      memberId,
      body.role,
    );
  }

  @Delete(":id/members/:memberId")
  removeMember(
    @Param("id") id: string,
    @Param("memberId") memberId: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.documentsService.removeMember(
      id,
      req.user.id,
      memberId,
    );
  }
}
