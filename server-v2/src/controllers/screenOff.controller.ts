import { HandleParameters } from "../types";
import { getDefaultRoomData } from "../utils/dataUtils";
import { safeClose } from "../utils/mediaUtils";

/**
 * Клиент остановил демонстрацию экрана
 */
export const screenOff: (...args: HandleParameters<"screenOff">) => void =
  async function (data, callback, _, socket) {
    try {
      const { peerId, roomId } = data;
      const { room, peer } = getDefaultRoomData(peerId, roomId);
      const screenProdId = peer.screenProducer.id;

      safeClose(peer.screenProducer);
      /**
       * тут должно отработать событие close на продюсере и подчистить все консюмены
       */
      peer.screenProducer = null;

      const ids = room.peers.filter((p) => p.isJoined).map((p) => p.socketId);

      if (ids.length > 0 && socket) {
        socket.to(ids).emit("peer:screenOff", peer.id, screenProdId);
      }

      callback?.({
        ok: true,
        data: null,
      });
    } catch (err) {}
  };
