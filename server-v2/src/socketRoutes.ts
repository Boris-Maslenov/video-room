import { Server, Socket } from "socket.io";
import { createRoomController } from "./controllers";
import { handlerWithSocket } from "./utils/socketUtils";
import { SocketEvents } from "./types";

export const createSocketRouter = (io: Server) => {
  io.on("connection", (socket: Socket<SocketEvents>) => {
    console.log("io.connection: ", socket.id);
    socket.on("createRoom", createRoomController);
    // socket.on("join", () => {});
    // socket.on("leave", () => {});
  });
};

// TODO:  socket.handshake.query можно использовать для восстановления соединения
