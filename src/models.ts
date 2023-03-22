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

export class Message {
  public author: string;
  public readonly content: string;
  public readonly timestamp: number;

  public readonly receiver: string;

  constructor(
    author: string,
    content: string,
    timestamp: number,
    receiver: string
  ) {
    this.author = author;
    this.content = content;
    this.timestamp = timestamp;

    this.receiver = receiver;
  }

  toString(): string {
    return JSON.stringify(this);
  }
}
