import { Server, Socket } from "socket.io";
import { ServerEvents, ClientEvents } from "./types";
import { log } from "./utils/dataUtils";
import {
  createPeer,
  joinRoom,
  getRouterRtpCapabilities,
  createSendTransport,
  connectSendTransport,
  produce,
  createRecvTransport,
  connectRecvTransport,
  createConsumer,
  peerConnected,
  endCall,
  camOff,
  camOn,
  screenOff,
  screenOn,
  consumerPause,
  consumerResume,
  toggleMic,
  createRoom,
  closePeer,
} from "./controllers/index";

const routes: Partial<ClientEvents> = {
  createRoom,
  createPeer,
  joinRoom,
  getRouterRtpCapabilities,
  createSendTransport,
  connectSendTransport,
  produce,
  createRecvTransport,
  connectRecvTransport,
  createConsumer,
  peerConnected,
  endCall,
  camOff,
  camOn,
  screenOff,
  screenOn,
  consumerPause,
  consumerResume,
  toggleMic,
};

const disconnect = (reason: string, io: Server, socket: Socket) => {
  log(reason, socket.id, "red");
  const ids = Array.from(io.sockets.sockets.keys());
  log("all: ", ids, "red");
  closePeer(socket);
};

export const createSocketRouter = (io: Server) => {
  io.on("connection", (socket: Socket<ClientEvents, ServerEvents>) => {
    // socket.on("disconnect", (r) => disconnect.bind(null, [r, io, socket]));
    socket.on("disconnect", (r) => {
      log(r, socket.id, "red");
      const ids = Array.from(io.sockets.sockets.keys());
      log("all: ", ids, "red");
      closePeer(socket);
    });

    for (const key in routes) {
      socket.on(key as keyof ClientEvents, routes[key]);
    }
  });
};

// TODO:  socket.handshake.query можно использовать для восстановления соединения
