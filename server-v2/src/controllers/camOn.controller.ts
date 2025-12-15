import { Socket } from "socket.io";
import { HandleParameters, ServerEvents } from "../types";
import { getDefaultRoomData, log } from "../utils/dataUtils";
import { updatePeer } from "../models/room";
/**
 * Клиент включил камеру
 * todo: переписать на toggleCam
 */
export const camOn: (...args: HandleParameters<"camOn">) => void =
  async function (this: Socket<{}, ServerEvents>, data, callback) {
    try {
      const socket = this;
      const { peerId, roomId } = data;
      const { room, peer } = getDefaultRoomData(peerId, roomId);
      const producerId = peer.videoProducer.id;
      const ids = room.peers.filter((p) => p.isJoined).map((p) => p.socketId);

      updatePeer(roomId, { ...peer, camOn: true });

      if (ids.length > 0) {
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
