import { Socket } from "socket.io";
import { cleanupConsumers, safeClose } from "../utils/mediaUtils";
import { HandleParameters, ServerEvents } from "../types";
import { getDefaultRoomData } from "../utils/dataUtils";
import { deletePeer } from "../models/room";
import { log } from "../utils/dataUtils";

/**
 * Клиент нажал кнопку завершить звонок
 */
// TODO: рассмотреть объединение endCallController и closePeerController
export const endCall: (...args: HandleParameters<"endCall">) => void =
  async function (this: Socket<{}, ServerEvents>, data, callback) {
    log(`endCall controller start`, "red");
    try {
      const socket = this;
      const { peerId, roomId } = data;
      const { room, peer } = getDefaultRoomData(peerId, roomId);

      safeClose(
        peer.audioProducer,
        peer.videoProducer,
        peer.screenProducer,
        peer.sendTransport,
        peer.recvTransport
      );

      /**
       * тут должно отработать событие close на продюсере и подчистить все консюмены
       */

      // room.consumers = room.consumers
      //   .map((c) => {
      //     c.appData.peerId === peer.id && safeClose(c);
      //     return c;
      //   })
      //   .filter((c) => c.appData.peerId !== peer.id);

      room.consumers = cleanupConsumers(room.consumers, peer.id);

      deletePeer(room.id, peer.id);

      log(
        "после удаления",
        room.peers.map((p) => p.name),
        room.consumers.map((p) => p.id),
        "red"
      );

      const ids = room.peers.filter((p) => p.isJoined).map((p) => p.socketId);

      if (ids.length > 0) {
        socket.to(ids).emit("peer:closed", peer.id);
        socket.to(ids).emit("room:updateCount", ids.length);
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
