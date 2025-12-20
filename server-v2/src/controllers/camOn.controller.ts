import { HandleParameters } from "../types";
import { getDefaultRoomData } from "../utils/dataUtils";
import { updatePeer } from "../models/room";

/**
 * Клиент включил камеру
 * todo: переписать на toggleCam
 */
export const camOn: (...args: HandleParameters<"camOn">) => void =
  async function (data, callback, _, socket) {
    try {
      const { peerId, roomId } = data;
      const { room, peer } = getDefaultRoomData(peerId, roomId);
      const producerId = peer.videoProducer.id;
      const ids = room.peers.filter((p) => p.isJoined).map((p) => p.socketId);

      updatePeer(roomId, { ...peer, camOn: true });

      if (ids.length > 0 && socket) {
        socket.to(ids).emit("peer:camOn", peer.id, producerId);
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
