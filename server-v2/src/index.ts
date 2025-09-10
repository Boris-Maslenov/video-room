import { Server } from "socket.io";
import http from "http";
import { WS_PORT } from "./config";
import { createSocketRouter } from "./socketRoutes";
import { log } from "./utils/dataUtils";

const server = http.createServer();

const socketio = new Server(server, {
  cors: {
    credentials: true,
  },
});

server.listen(WS_PORT, () => {
  createSocketRouter(socketio);
  log(`WS Сервер успешно запущен на ${WS_PORT} порту`, "blue");
});
