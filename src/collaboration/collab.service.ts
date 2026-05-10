import { Injectable } from "@nestjs/common";

type PresenceUser = {
  userId: string;
  name: string;
};

@Injectable()
export class CollabService {
  private rooms = new Map<string, Map<string, PresenceUser>>();

  addUser(docId: string, userId: string, name: string) {
    if (!this.rooms.has(docId)) {
      this.rooms.set(docId, new Map());
    }
    this.rooms.get(docId)!.set(userId, { userId, name });
  }

  removeUserFromAll(userId: string) {
    const affectedDocs: string[] = [];

    for (const [docId, users] of this.rooms.entries()) {
      if (users.has(userId)) {
        users.delete(userId);
        affectedDocs.push(docId);
        if (users.size === 0) this.rooms.delete(docId);
      }
    }

    return affectedDocs;
  }

  getUsers(docId: string) {
    return Array.from(this.rooms.get(docId)?.values() || []);
  }
}
