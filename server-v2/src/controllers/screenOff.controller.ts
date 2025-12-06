import { Socket } from "socket.io";
import { HandleParameters, ServerEvents } from "../types";
import { getDefaultRoomData, log } from "../utils/dataUtils";
import { safeClose } from "../utils/mediaUtils";

/**
 * Клиент остановил демонстрацию экрана
 */
export const screenOff: (...args: HandleParameters<"screenOff">) => void =
  async function (this: Socket<{}, ServerEvents>, data, callback) {
    try {
      const socket = this;
      const { peerId, roomId } = data;
      const { room, peer } = getDefaultRoomData(peerId, roomId);
      const screenProdId = peer.screenProducer.id;

      safeClose(peer.screenProducer);
      /**
       * тут должно отработать событие close на продюсере и подчистить все консюмены
       */
      peer.screenProducer = null;

      // room.consumers = room.consumers
      //   .map((c) => {
      //     c.producerId === screenProdId && safeClose(c);
      //     return c;
      //   })
      //   .filter((c) => c.producerId !== screenProdId);

      const ids = room.peers.filter((p) => p.isJoined).map((p) => p.socketId);

      if (ids.length > 0) {
        socket.to(ids).emit("peer:screenOff", peer.id, screenProdId);
      }

      callback?.({
        ok: true,
        data: null,
      });
    } catch (err) {}
  };
