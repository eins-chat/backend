import ws, { WebSocket, Server } from "ws";
import { Message, Client, MessageType } from "./models";
import * as db from "./database";
import { verify } from "./util/jwt";

let connectedClients: Client[] = [];

export function start() {
	console.log("Starting server...");
	const PORT = process.env.WEB_SOCKET_PORT || "8080";

	const wss = new Server({
		port: parseInt(PORT),
	});

	wss.on("connection", (socket) => onConnect(socket));
}

function onConnect(websocket: WebSocket) {
	websocket.once("message", (messageRaw) => {
		const message = JSON.parse(messageRaw.toString());

		const payload = verify(message.token);

		if (typeof payload === "string") {
			websocket.close();
			return;
		}

		console.log("New client connected: " + payload.username);
		connectedClients.push({
			name: payload.username,
			connection: websocket,
		});

		websocket.on("message", async (messageRaw) => {
			const message = decodeMessage(messageRaw);
			const author = connectedClients
				.filter((client) => client.connection === websocket)
				.at(0)?.name;

			if (!author) {
				websocket.close();
				return;
			}

			message.author = author;
			db.addMessage(message);

			const socket = connectedClients.find(
				(client) => client.connection === websocket
			);

			if (message.type === MessageType.PRIVATE_CHAT) {
				websocket.send(JSON.stringify(message));
			}

			if (socket) {
				console.log(socket.name + ": " + JSON.stringify(message));

				if (message.type === MessageType.PRIVATE_CHAT) {
					connectedClients
						.filter((client) => client.name === message.receiver)
						.forEach((client) => {
							client.connection.send(JSON.stringify(message));
						});
				} else {
					const group = await db.getGroupByID(message.receiver);

					if (!group) {
						return;
					}

					connectedClients
						.filter((client) => group.members.includes(client.name))
						.forEach((client) => {
							client.connection.send(JSON.stringify(message));
						});
				}
			}
		});
	});

	websocket.on("close", () => {
		console.log("A client disconnected");

		connectedClients = connectedClients.filter(
			(client) => client.connection.readyState !== ws.CLOSED
		);

		console.log("List of connected clients:");
		connectedClients.forEach((c) => console.log(c.name));
		console.log("-----");
	});
}

function decodeMessage(raw: ws.RawData): Message {
	const msgStr = raw.toString();
	const json = JSON.parse(msgStr);

	// TODO: Validierung, ob richtiges Format?

	return {
		author: json.author,
		content: json.content,
		type: json.type,
		timestamp: Date.now(),
		receiver: json.receiver,
	};
}
