import { WebSocket } from "ws";

export class Client {
  public readonly connection: WebSocket;
  public readonly name: string;

  constructor(connection: WebSocket, name: string) {
    this.connection = connection;
    this.name = name;
  }
}

export class User {
  public readonly username: string;
  public readonly passwortHash: string;

  constructor(username: string, passwortHash: string) {
    this.username = username;
    this.passwortHash = passwortHash;
  }
}

export enum MessageType {
  PRIVATE_CHAT,
  GROUP_CHAT,
}

export class Message {
  public author: string;
  public readonly content: string;
  public readonly type: MessageType = MessageType.PRIVATE_CHAT;
  public readonly timestamp: number;
  public readonly receiver: string;

  constructor(
    author: string,
    content: string,
    type: MessageType,
    timestamp: number,
    receiver: string
  ) {
    this.author = author;
    this.content = content;
    this.type = type;
    this.timestamp = timestamp;

    this.receiver = receiver;
  }

  toString(): string {
    return JSON.stringify(this);
  }
}
export class Group {
  public readonly groupID: string;
  public readonly memberList: string[];
  public readonly groupName: string;
  constructor(groupID: string, groupName: string, memberList: string[]) {
    this.groupID = groupID;
    this.groupName = groupName;
    this.memberList = memberList;
  }
}
