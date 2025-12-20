import { HandleParameters } from "../types";
import { getDefaultRoomData } from "../utils/dataUtils";

/**
 * Клиент начал демонстрацию экрана
 */
export const screenOn: (...args: HandleParameters<"screenOn">) => void =
  async function (data, callback, _, socket) {
    try {
      const { peerId, roomId } = data;
      const { room, peer } = getDefaultRoomData(peerId, roomId);
      const screenProdId = peer.screenProducer.id;
      const ids = room.peers.filter((p) => p.isJoined).map((p) => p.socketId);

      if (ids.length > 0 && socket) {
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
