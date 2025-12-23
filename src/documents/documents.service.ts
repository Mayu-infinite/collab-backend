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

  // GET MY DOCUMENTS
  async getMyDocuments(ownerId: string) {
    return this.prisma.document.findMany({
      where: {
        ownerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
