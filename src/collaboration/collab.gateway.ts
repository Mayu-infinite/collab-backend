import { JwtService } from "@nestjs/jwt";
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { CollabService } from "./collab.service";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class CollabGateway {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly collabService: CollabService,
  ) { }

  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth.token;
      const payload = this.jwtService.verify(token);
      socket.data.user = payload;
    } catch {
      socket.disconnect();
    }
  }

  @SubscribeMessage("join-document")
  async joinDocument(
    @ConnectedSocket() socket: Socket,
    @MessageBody() documentId: string,
  ) {
    const user = socket.data.user;
    socket.join(documentId);

    this.collabService.addUser(documentId, user.id, user.name);

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
    const user = socket.data.user;

    if (!user) return;

    const docs = this.collabService.removeUserFromAll(user.id);
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
    });
  }
}
