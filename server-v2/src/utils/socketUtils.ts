import { Socket } from "socket.io";
import { SocketEvents } from "../types";

export const handlerWithSocket = <T extends keyof SocketEvents>(
  socket: Socket
) => {
  return (
      handler: (
        ...args: [...Parameters<SocketEvents[T]>, socket: Socket]
      ) => void
    ) =>
    (...args: Parameters<SocketEvents[T]>) =>
      handler(...args, socket);
};
