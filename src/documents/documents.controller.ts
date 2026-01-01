import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
  Param,
  Put,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/auth.guard";
import { DocumentsService } from "./documents.service";

@Controller("documents")
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

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
}
