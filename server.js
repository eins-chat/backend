const http = require("http");
const ws = require("ws");
const wss = new ws.Server({ noServer: true });
let connectedClients = [];
function accept(req, res) {
  // all incoming requests must be websockets
  if (
    !req.headers.upgrade ||
    req.headers.upgrade.toLowerCase() != "websocket"
  ) {
    res.end();
    return;
  }

  // can be Connection: keep-alive, Upgrade
  if (!req.headers.connection.match(/\bupgrade\b/i)) {
    res.end();
    return;
  }

  wss.handleUpgrade(req, req.socket, Buffer.alloc(0), onConnect);
}

function onConnect(websocket) {
  websocket.on("message", function (message) {
    message = message.toString();
    message = JSON.parse(message);
    message.time = Date.now();
    socket = connectedClients.find((client) => client.connection === websocket);
    if (socket) {
      console.log(socket.name + ": " + JSON.stringify(message));
      connectedClients
        .filter((client) => client.name === message.receiver)
        .at(0)
        .connection.send(message.message);
    } else {
      sender = message.sender;
      console.log("new client connected: " + sender);
      connectedClients.push(new client(websocket, sender));
    }
  });

  websocket.on("close", function (message) {
    console.log("a client disconnected");
    connectedClients = connectedClients.filter(
      (client) => client.connection.readyState !== ws.CLOSED
    );
    console.log("List of connected clients:");
    connectedClients.forEach((c) => console.log(c.name));
    console.log("-----");
  });
}

if (!module.parent) {
  http.createServer(accept).listen(8080);
} else {
  exports.accept = accept;
}

class client {
  constructor(connection, name) {
    this.connection = connection;
    this.name = name;
  }
  connection;
  name;
}
