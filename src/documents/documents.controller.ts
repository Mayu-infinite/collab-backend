import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/auth.guard';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // POST /documents
  @UseGuards(JwtAuthGuard)
  @Post()
  createDocument(
    @Req() req: Request & { user: any },
    @Body() body: { title: string; content?: string },
  ) {
    return this.documentsService.createDocument(
      req.user.userId,
      body.title,
      body.content,
    );
  }

  // GET /documents
  @UseGuards(JwtAuthGuard)
  @Get()
  getMyDocuments(@Req() req: Request & { user: any }) {
    return this.documentsService.getMyDocuments(req.user.userId);
  }

  // GET /documents/:id
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getDocumentById(
    @Param('id') id: string,
    @Req() req: Request & { user: any },
  ) {
    return this.documentsService.getDocumentById(
      id,
      req.user.userId,
    );
  }

  // PUT /documents/:id
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  updateDocument(
    @Param('id') id: string,
    @Req() req: Request & { user: any },
    @Body() body: { title?: string; content?: string },
  ) {
    return this.documentsService.updateDocument(
      id,
      req.user.userId,
      body.title,
      body.content,
    );
  }
}
