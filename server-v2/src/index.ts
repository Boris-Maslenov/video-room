import mediasoup from "mediasoup";
import { randomUUID } from "crypto";
import { Server } from "socket.io";
import http from "http";
import { WS_PORT } from "./config";
import { createSocketRouter } from "./socketRoutes";

const server = http.createServer();

const socketio = new Server(server, {
  cors: {
    credentials: true,
  },
});

server.listen(WS_PORT, () => {
  createSocketRouter(socketio);
  console.log(`WS Сервер успешно запущен на ${WS_PORT} порту`);
});
