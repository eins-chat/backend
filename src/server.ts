import http, { IncomingMessage, ServerResponse } from "http";
import ws, { WebSocket, Server } from "ws";
import { Message, Client, MessageType } from "./models";
import * as db from "./database";
import { verify } from "./util/jwt";

const wss = new Server({ noServer: true });

let connectedClients: Client[] = [];

export function start() {
  console.log("Starting server...");
  const PORT = process.env.WEB_SOCKET_PORT || 8080;
  http.createServer(accept).listen(PORT);
}

function accept(req: IncomingMessage, res: ServerResponse) {
  // all incoming requests must be websockets
  if (
    !req.headers.upgrade ||
    req.headers.upgrade.toLowerCase() != "websocket"
  ) {
    res.end();
    return;
  }

  // can be Connection: keep-alive, Upgrade
  if (!req.headers.connection?.match(/\bupgrade\b/i)) {
    res.end();
    return;
  }

  wss.handleUpgrade(req, req.socket, Buffer.alloc(0), onConnect);
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
    connectedClients.push(new Client(websocket, payload.username));

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
      websocket.send(message.toString());
      if (socket) {
        console.log(socket.name + ": " + JSON.stringify(message));
        if (message.type === MessageType.PRIVATE_CHAT) {
          connectedClients
            .filter((client) => client.name === message.receiver)
            .forEach((client) => {
              client.connection.send(message.toString());
            });
        } else {
          const group = await db.getGroupByID(message.receiver);
          if (!group) {
            return;
          }
          connectedClients
            .filter((client) => group.memberList.includes(client.name))
            .forEach((client) => {
              client.connection.send(message.toString());
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

  return new Message(
    json.author,
    json.content,
    json.type,
    Date.now(),
    json.receiver
  );
}
