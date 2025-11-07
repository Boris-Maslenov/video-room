import { Socket } from "socket.io";
import { HandleParameters, ServerEvents } from "../types";
import { getDefaultRoomData } from "../utils/dataUtils";

/**
 * Клиент начал демонстрацию экрана
 */
export const screenOn: (...args: HandleParameters<"screenOn">) => void =
  async function (this: Socket<{}, ServerEvents>, data, callback) {
    try {
      const socket = this;
      const { peerId, roomId } = data;
      const { room, peer } = getDefaultRoomData(peerId, roomId);
      const screenProdId = peer.screenProducer.id;
      const ids = room.peers.filter((p) => p.isJoined).map((p) => p.socketId);

      if (ids.length > 0) {
        socket.to(ids).emit("peer:screenOn", peer.id, screenProdId);
      }

      callback?.({
        ok: true,
        data: null,
      });
    } catch (err) {
      callback?.({
        ok: false,
        error: {
          message: err?.message,
        },
      });
    }
  };
