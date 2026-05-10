import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Role } from "@prisma/client";

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) { }

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

        isCollaborative: true,
      },
    });
  }

  // ===============================
  // GET ALL DOCUMENTS OF LOGGED-IN USER
  // ===============================
  async getMyDocuments(ownerId: string) {
    return this.prisma.document.findMany({
      where: {
        OR: [
          { ownerId },
          {
            members: {
              some: { userId: ownerId },
            },
          },
        ], // 🔐 user isolation
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
        OR: [
          { ownerId },
          {
            members: {
              some: { userId: ownerId },
            },
          },
        ], // 🔐 ownership enforced
      },
      select: {
        id: true,
        title: true,
        content: true,
        updatedAt: true,

        isCollaborative: true,

        inviteCode: true
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
    userId: string,
    title?: string,
    content?: string,
  ) {
    // 🔍 ownership check
    const member = await this.prisma.documentMember.findFirst({
      where: {
        documentId,
        userId,
        role: { in: ["OWNER", "EDITOR"] },
      },
      select: { id: true },
    });

    if (!member) {
      throw new ForbiddenException(
        "You do not have permission to update this document",
      );
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

  async enableCollaboration(
    documentId: string,
    userId: string,
  ) {
    const document =
      await this.prisma.document.findFirst({
        where: {
          id: documentId,
          ownerId: userId,
        }
      });

    if (!document) {
      throw new ForbiddenException(
        "Only owner can enable Collaboration"
      )
    }

    const inviteCode = crypto.randomUUID()

    return this.prisma.document.update({
      where: {
        id: documentId,
      },

      data: {
        isCollaborative: true,
        inviteCode,
      },

      select: {
        id: true,
        isCollaborative: true,
        inviteCode: true,
      }
    })
  }

  async disableCollaboration(
    documentId: string,
    userId: string,
  ) {
    const document =
      await this.prisma.document.findFirst({
        where: {
          id: documentId,
          ownerId: userId,
        }
      })

    if (!document) {
      throw new ForbiddenException(
        "Only Owner can disable the collaboration"
      )
    }

    return this.prisma.document.update({
      where: {
        id: documentId
      },

      data: {
        isCollaborative: false,
        inviteCode: null,
      }
    })
  }

  async joinCollaboration(
    inviteCode: string,
    userId: string,
  ) {
    const document =
      await this.prisma.document.findFirst({
        where: {
          inviteCode: inviteCode,
          isCollaborative: true,
        }
      })

    if (!document) {
      throw new NotFoundException(
        "Invalid Collaboration Link"
      )
    }

    const existingMember =
      await this.prisma.documentMember.findFirst({
        where: {
          documentId: document.id,
          userId,
        }
      });

    if (!existingMember) {
      await this.prisma.documentMember.create({
        data: {
          documentId: document.id,
          userId,
          role: "EDITOR",
        }
      })
    }

    return {
      id: document.id,
      title: document.title,
    };
  }
}
