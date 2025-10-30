import { type Socket } from "socket.io-client";
import { ErrorSocketType, isErrorSocketType, ApiResult } from "./api.types";

export class ApiError extends Error {
  code?: string | number;
  details?: unknown;
  message: string;

  constructor(err: ErrorSocketType) {
    super();
    this.message = err.error.message;
  }
}

export const socketPromise = (socket: Socket) => {
  return <T>(type: string, data = {}): Promise<ApiResult<T>> =>
    new Promise((resolve, reject) => {
      socket.emit(type, data, (res: ApiResult<T> | ErrorSocketType) =>
        isErrorSocketType(res) ? reject(new ApiError(res)) : resolve(res)
      );
    });
};
