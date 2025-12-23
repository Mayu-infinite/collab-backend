import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  // CREATE DOCUMENT
  async createDocument(ownerId: string, title: string, content?: string) {
    const data: any = {
      title,
      owner: {
        connect: { id: ownerId },
      },
    };

    if (content !== undefined) {
      data.content = content;
    }

    return this.prisma.document.create({ data });
  }

  // GET ALL DOCUMENTS OF LOGGED-IN USER
  async getMyDocuments(ownerId: string) {
    return this.prisma.document.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // GET SINGLE DOCUMENT (OWNER ONLY)
  async getDocumentById(documentId: string, ownerId: string) {
    return this.prisma.document.findFirst({
      where: {
        id: documentId,
        ownerId,
      },
    });
  }

  // UPDATE DOCUMENT (OWNER ONLY)
  async updateDocument(
    documentId: string,
    ownerId: string,
    title?: string,
    content?: string,
  ) {
    const data: any = {};

    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;

    // ownership check
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, ownerId },
    });

    if (!document) {
      return null; // later → ForbiddenException
    }

    return this.prisma.document.update({
      where: { id: documentId },
      data,
    });
  }
}
