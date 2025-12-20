import { cleanupConsumers, safeClose } from "../utils/mediaUtils";
import { HandleParameters } from "../types";
import { getDefaultRoomData } from "../utils/dataUtils";
import { deletePeer } from "../models/room";

/**
 * Клиент нажал кнопку завершить звонок
 */
// TODO: рассмотреть объединение endCallController и closePeerController
export const endCall: (...args: HandleParameters<"endCall">) => void =
  async function (data, callback, _, socket) {
    try {
      const { peerId, roomId } = data;
      const { room, peer } = getDefaultRoomData(peerId, roomId);

      safeClose(
        peer.audioProducer,
        peer.videoProducer,
        peer.screenProducer,
        peer.sendTransport,
        peer.recvTransport
      );

      room.consumers = cleanupConsumers(room.consumers, peer.id);

      deletePeer(room.id, peer.id);

      const ids = room.peers.filter((p) => p.isJoined).map((p) => p.socketId);

      if (ids.length > 0 && socket) {
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
