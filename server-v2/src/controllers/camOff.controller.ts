import { HandleParameters } from "../types";
import { getDefaultRoomData } from "../utils/dataUtils";
import { safeClose } from "../utils/mediaUtils";
import { updatePeer } from "../models/room";

/**
 * Клиент выключил камеру
 */
export const camOff: (...args: HandleParameters<"camOff">) => void =
  async function (data, callback, _, socket) {
    try {
      const { peerId, roomId } = data;
      const { room, peer } = getDefaultRoomData(peerId, roomId);
      const producerId = peer.videoProducer.id;
      const ids = room.peers.filter((p) => p.isJoined).map((p) => p.socketId);

      safeClose(peer.videoProducer);
      updatePeer(roomId, { ...peer, camOn: false, videoProducer: null });

      if (ids.length > 0 && socket) {
        socket.to(ids).emit("peer:camOff", peer.id, producerId);
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
