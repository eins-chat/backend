import { WebSocket } from "ws";

export interface Client {
	name: string;
	connection: WebSocket;
}

export interface User {
	name: string;
	passwordHash: string;
}

export enum MessageType {
	PRIVATE_CHAT = 0,
	GROUP_CHAT = 1,
}

export interface Message {
	author: string;
	content: string;
	type: MessageType;
	timestamp: number;
	receiver: string;
}

export interface Group {
	id: string;
	members: string[];
	name: string;
}
