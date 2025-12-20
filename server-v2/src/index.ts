import { Server } from "socket.io";
import http from "http";
import { WS_PORT } from "./config";
import { createSocketRouter } from "./socketRoutes";
import { log } from "./utils/dataUtils";
import { createRoomService } from "./services/room.service";

const server = http.createServer();

const socketio = new Server(server, {
  cors: {
    credentials: true,
  },
});

server.listen(WS_PORT, "0.0.0.0", async () => {
  createSocketRouter(socketio);
  await createRoomService();

  log(`WS Сервер успешно запустился на ${WS_PORT} порту`, "blue");
});
