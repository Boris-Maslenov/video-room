import { io, type Socket } from "socket.io-client";
import {
  SocketSendType,
  ErrorSocketType,
  isErrorSocketType,
} from "./api.types";

const WS_URL = "ws://localhost:3001";
export const socket = io(WS_URL);

class ApiError extends Error {
  constructor(err: ErrorSocketType) {
    super();
    this.message = err.message;
  }
}

const socketPromise = <T>(socket: Socket) => {
  return (type: string, data = {}): Promise<T> =>
    new Promise((resolve, reject) => {
      socket.emit(type, data, (res: T | ErrorSocketType) =>
        isErrorSocketType(res) ? reject(new ApiError(res)) : resolve(res)
      );
    });
};

export const apiSend: SocketSendType = socketPromise(socket);
