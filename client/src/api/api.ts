import { io, type Socket } from "socket.io-client";
import {
  SocketSendType,
  ErrorSocketType,
  isErrorSocketType,
} from "./api.types";

const WS_URL = "ws://localhost:3001";
// const WS_URL = "ws://192.168.0.104:3001";
export const socket = io(WS_URL);

const socketPromise = <T>(socket: Socket) => {
  return (type: string, data = {}): Promise<T> =>
    new Promise((resolve, reject) => {
      socket.emit(type, data, (res: T | ErrorSocketType) =>
        isErrorSocketType(res) ? reject(res) : resolve(res)
      );
    });
};

export const apiSend: SocketSendType = socketPromise(socket);
