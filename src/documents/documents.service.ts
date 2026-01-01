import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  // ===============================
  // CREATE DOCUMENT
  // ===============================
  async createDocument(ownerId: string, title: string, content = "") {
    return this.prisma.document.create({
      data: {
        title,
        content,
        owner: {
          connect: { id: ownerId },
        },

        members: {
          create: {
            userId: ownerId,
            role: "OWNER",
          },
        },
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // ===============================
  // GET ALL DOCUMENTS OF LOGGED-IN USER
  // ===============================
  async getMyDocuments(ownerId: string) {
    return this.prisma.document.findMany({
      where: {
        ownerId, // 🔐 user isolation
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    });
  }

  // ===============================
  // GET SINGLE DOCUMENT (OWNER ONLY)
  // ===============================
  async getDocumentById(documentId: string, ownerId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        ownerId, // 🔐 ownership enforced
      },
      select: {
        id: true,
        title: true,
        content: true,
      },
    });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    return document;
  }

  // ===============================
  // UPDATE DOCUMENT (OWNER ONLY)
  // ===============================
  async updateDocument(
    documentId: string,
    ownerId: string,
    title?: string,
    content?: string,
  ) {
    // 🔍 ownership check
    const exists = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        ownerId,
      },
      select: { id: true },
    });

    if (!exists) {
      throw new ForbiddenException("You do not have access to this document");
    }

    return this.prisma.document.update({
      where: { id: documentId },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
      },
      select: {
        id: true,
        title: true,
        content: true,
        updatedAt: true,
      },
    });
  }
}
