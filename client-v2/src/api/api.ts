import { io, type Socket } from "socket.io-client";
import {
  SocketSendType,
  ErrorSocketType,
  isErrorSocketType,
  ApiResult,
} from "./api.types";

const WS_URL = "http://127.0.0.1:3001";
export const socket = io(WS_URL);

class ApiError extends Error {
  code?: string | number;
  details?: unknown;
  message: string;

  constructor(err: ErrorSocketType) {
    super();
    this.message = err.error.message;
  }
}

const socketPromise = <T>(socket: Socket) => {
  return (type: string, data = {}): Promise<ApiResult<T>> =>
    new Promise((resolve, reject) => {
      socket.emit(type, data, (res: ApiResult<T> | ErrorSocketType) =>
        isErrorSocketType(res) ? reject(new ApiError(res)) : resolve(res)
      );
    });
};

export const apiSend: SocketSendType = socketPromise(socket);
