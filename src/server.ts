import http, { IncomingMessage, ServerResponse } from "http";
import ws, { WebSocket, Server, RawData } from "ws";
import { MongoClient } from "mongodb";
import { Message, Client } from "./models";
import * as db from "./database";
const wss = new Server({ noServer: true });
let connectedClients: Client[] = [];
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri, {
  auth: {
    username: "root",
    password: "pw",
  },
});
const database = client.db("einsChat");
const messagesCollection = database.collection("messages");

export function start() {
  console.log("Starting server...");

  if (!module.parent) {
    http.createServer(accept).listen(8080);
  } else {
    exports.accept = accept;
  }
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
    const message = decodeMessage(messageRaw);
    const author = message.author;
    console.log("New client connected: " + author);
    connectedClients.push(new Client(websocket, author));

    websocket.on("message", async (messageRaw) => {
      const message = decodeMessage(messageRaw);
      db.addMessage(message);
      const socket = connectedClients.find(
        (client) => client.connection === websocket
      );

      if (socket) {
        console.log(socket.name + ": " + JSON.stringify(message));
        connectedClients
          .filter((client) => client.name === message.receiver)
          .forEach((client) => {
            client.connection.send(message.toString());
          });
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

  return new Message(json.author, json.content, Date.now(), json.receiver);
}
