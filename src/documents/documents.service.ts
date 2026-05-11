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

  private toPreviewText(content: string) {
    return content
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);
  }

  private async getMembership(documentId: string, userId: string) {
    return this.prisma.documentMember.findFirst({
      where: {
        documentId,
        userId,
      },
      select: {
        id: true,
        role: true,
      },
    });
  }

  async canEditDocument(documentId: string, userId: string) {
    const member = await this.getMembership(documentId, userId);

    return member?.role === "OWNER" || member?.role === "EDITOR";
  }

  async canViewDocument(documentId: string, userId: string) {
    const member = await this.getMembership(documentId, userId);

    return Boolean(member);
  }

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
        inviteCode: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    }).then((document) => ({
      ...document,
      currentUserRole: "OWNER" as Role,
      canEdit: true,
      canDelete: true,
      previewText: this.toPreviewText(document.content),
      memberCount: document.members.length,
    }));
  }

  // ===============================
  // GET ALL DOCUMENTS OF LOGGED-IN USER
  // ===============================
  async getMyDocuments(ownerId: string) {
    const documents = await this.prisma.document.findMany({
      where: {
        members: {
          some: { userId: ownerId },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        isCollaborative: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          select: {
            id: true,
            role: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return documents.map((document) => {
      const membership = document.members.find(
        (member) => member.userId === ownerId,
      );
      const currentUserRole = membership?.role ?? "VIEWER";

      return {
        id: document.id,
        title: document.title,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        isCollaborative: document.isCollaborative,
        owner: document.owner,
        ownerId: document.ownerId,
        currentUserRole,
        canEdit: currentUserRole === "OWNER" || currentUserRole === "EDITOR",
        canDelete: currentUserRole === "OWNER",
        previewText: this.toPreviewText(document.content),
        memberCount: document.members.length,
        members: document.members.map((member) => ({
          id: member.id,
          role: member.role,
          user: member.user,
        })),
      };
    });
  }

  // ===============================
  // GET SINGLE DOCUMENT (OWNER ONLY)
  // ===============================
  async getDocumentById(documentId: string, ownerId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        members: {
          some: { userId: ownerId },
        },
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        isCollaborative: true,
        inviteCode: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          select: {
            id: true,
            role: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    const membership = document.members.find(
      (member) => member.userId === ownerId,
    );
    const currentUserRole = membership?.role ?? "VIEWER";

    return {
      ...document,
      currentUserRole,
      canEdit: currentUserRole === "OWNER" || currentUserRole === "EDITOR",
      canDelete: currentUserRole === "OWNER",
      previewText: this.toPreviewText(document.content),
      memberCount: document.members.length,
      members: document.members.map((member) => ({
        id: member.id,
        role: member.role,
        user: member.user,
      })),
    };
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

  async deleteDocument(documentId: string, userId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        ownerId: userId,
      },
      select: {
        id: true,
      },
    });

    if (!document) {
      throw new ForbiddenException("Only the owner can delete this document");
    }

    await this.prisma.documentMember.deleteMany({
      where: { documentId },
    });

    await this.prisma.document.delete({
      where: { id: documentId },
    });

    return { id: documentId, deleted: true };
  }

  async updateMemberRole(
    documentId: string,
    ownerId: string,
    memberId: string,
    role: Role,
  ) {
    if (role === "OWNER") {
      throw new ForbiddenException("Ownership transfer is not supported yet");
    }

    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        ownerId,
      },
      select: { id: true },
    });

    if (!document) {
      throw new ForbiddenException("Only the owner can manage member roles");
    }

    const member = await this.prisma.documentMember.findFirst({
      where: {
        id: memberId,
        documentId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!member) {
      throw new NotFoundException("Member not found");
    }

    if (member.role === "OWNER") {
      throw new ForbiddenException("Owner role cannot be changed here");
    }

    return this.prisma.documentMember.update({
      where: { id: memberId },
      data: { role },
      select: {
        id: true,
        role: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async removeMember(documentId: string, ownerId: string, memberId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        ownerId,
      },
      select: { id: true },
    });

    if (!document) {
      throw new ForbiddenException("Only the owner can remove members");
    }

    const member = await this.prisma.documentMember.findFirst({
      where: {
        id: memberId,
        documentId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!member) {
      throw new NotFoundException("Member not found");
    }

    if (member.role === "OWNER") {
      throw new ForbiddenException("Owner cannot be removed");
    }

    await this.prisma.documentMember.delete({
      where: { id: memberId },
    });

    return { id: memberId, removed: true };
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
      },

      select: {
        id: true,
        isCollaborative: true,
        inviteCode: true,
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
