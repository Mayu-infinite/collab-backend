import { JwtService } from "@nestjs/jwt";
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { DocumentsService } from "../documents/documents.service";
import { CollabService } from "./collab.service";

type JwtPayload = {
  userId: string;
  name?: string;
};

type CursorPayload = {
  documentId: string;
  from: number;
  to: number;
};

type DocumentContentPayload = {
  documentId: string;
  content: string;
};

type ChatMessagePayload = {
  documentId: string;
  message: string;
};

@WebSocketGateway({
  cors: {
    origin: [
      "http://localhost:3000",
      "https://collab-frontend-sigma.vercel.app",
    ],
    credentials: true,
  },
})
export class CollabGateway {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly collabService: CollabService,
    private readonly documentsService: DocumentsService,
  ) { }

  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth.token as string | undefined;

      if (!token) {
        socket.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token);
      socket.data.user = payload;
    } catch {
      socket.disconnect(true);
    }
  }

  @SubscribeMessage("join-document")
  async joinDocument(
    @ConnectedSocket() socket: Socket,
    @MessageBody() documentId: string,
  ) {
    const user = socket.data.user as JwtPayload | undefined;

    if (!user?.userId) {
      socket.disconnect(true);
      return;
    }

    const canView = await this.documentsService.canViewDocument(
      documentId,
      user.userId,
    );

    if (!canView) {
      socket.emit("document-forbidden", { documentId });
      return;
    }

    socket.join(documentId);

    this.collabService.addUser(
      documentId,
      user.userId,
      user.name ?? "Collaborator",
    );

    const users =
      this.collabService.getUsers(
        documentId,
      );

    this.server
      .to(documentId)
      .emit(
        "users-list",
        users,
      );
  }

  handleDisconnect(socket: Socket) {
    const user = socket.data.user as JwtPayload | undefined;

    if (!user) return;

    const docs = this.collabService.removeUserFromAll(user.userId);
    docs.forEach((docId) => {
      const users =
        this.collabService.getUsers(
          docId,
        );

      this.server
        .to(docId)
        .emit(
          "users-list",
          users,
        );

      socket
        .to(docId)
        .emit("cursor-clear", {
          documentId: docId,
          userId: user.userId,
        });
    });
  }

  @SubscribeMessage("cursor-position")
  handleCursorPosition(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: CursorPayload,
  ) {
    const user = socket.data.user as JwtPayload | undefined;

    if (
      !user?.userId ||
      !payload?.documentId ||
      !Number.isFinite(payload.from) ||
      !Number.isFinite(payload.to) ||
      !socket.rooms.has(payload.documentId)
    ) {
      return;
    }

    socket
      .to(payload.documentId)
      .emit("cursor-position", {
        documentId: payload.documentId,
        userId: user.userId,
        name: user.name ?? "Collaborator",
        from: payload.from,
        to: payload.to,
      });
  }

  @SubscribeMessage("cursor-clear")
  handleCursorClear(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: { documentId: string },
  ) {
    const user = socket.data.user as JwtPayload | undefined;

    if (!user?.userId || !payload?.documentId) {
      return;
    }

    socket
      .to(payload.documentId)
      .emit("cursor-clear", {
        documentId: payload.documentId,
        userId: user.userId,
      });
  }

  @SubscribeMessage("document-content")
  async handleDocumentContent(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: DocumentContentPayload,
  ) {
    const user = socket.data.user as JwtPayload | undefined;

    if (
      !user?.userId ||
      !payload?.documentId ||
      typeof payload.content !== "string" ||
      !socket.rooms.has(payload.documentId)
    ) {
      return;
    }

    const canEdit = await this.documentsService.canEditDocument(
      payload.documentId,
      user.userId,
    );

    if (!canEdit) {
      socket.emit("document-readonly", {
        documentId: payload.documentId,
      });
      return;
    }

    socket
      .to(payload.documentId)
      .emit("document-content", {
        documentId: payload.documentId,
        content: payload.content,
        userId: user.userId,
      });
  }

  @SubscribeMessage("chat-message")
  async handleChatMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ChatMessagePayload,
  ) {
    const user = socket.data.user as JwtPayload | undefined;
    const message = payload?.message?.trim();

    if (
      !user?.userId ||
      !payload?.documentId ||
      !message ||
      message.length > 1000 ||
      !socket.rooms.has(payload.documentId)
    ) {
      return;
    }

    const canView = await this.documentsService.canViewDocument(
      payload.documentId,
      user.userId,
    );

    if (!canView) {
      socket.emit("document-forbidden", { documentId: payload.documentId });
      return;
    }

    this.server.to(payload.documentId).emit("chat-message", {
      id: `${Date.now()}-${user.userId}`,
      documentId: payload.documentId,
      userId: user.userId,
      name: user.name ?? "Collaborator",
      message,
      createdAt: new Date().toISOString(),
    });
  }
}
