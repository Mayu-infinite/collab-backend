import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/auth.guard';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // CREATE DOCUMENT
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

  // GET MY DOCUMENTS
  @UseGuards(JwtAuthGuard)
  @Get()
  getMyDocuments(@Req() req: Request & { user: any }) {
    return this.documentsService.getMyDocuments(req.user.userId);
  }
}