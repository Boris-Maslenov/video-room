import { Server, Socket } from "socket.io";
import {
  createRoomController,
  createPeerController,
  getRouterRtpCapabilities,
  createSendTransport,
  connectSendTransport,
} from "./controllers";
import { SocketEvents } from "./types";

export const createSocketRouter = (io: Server) => {
  io.on("connection", (socket: Socket<SocketEvents>) => {
    console.log("io.connection: ", socket.id);
    socket.on("createRoom", createRoomController);
    socket.on("createPeer", createPeerController);
    socket.on("getRouterRtpCapabilities", getRouterRtpCapabilities);
    socket.on("createSendTransport", createSendTransport);
    socket.on("connectSendTransport", connectSendTransport);
    // socket.on("join", () => {});
    // socket.on("leave", () => {});
  });
};

// TODO:  socket.handshake.query можно использовать для восстановления соединения
