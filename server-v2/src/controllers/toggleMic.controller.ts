import { Socket } from "socket.io";
import { HandleParameters, ServerEvents } from "../types";
import { getDefaultRoomData } from "../utils/dataUtils";
import { safeClose } from "../utils/mediaUtils";

export const toggleMic: (...args: HandleParameters<"toggleMic">) => void =
  async function (this: Socket<{}, ServerEvents>, data, callback) {
    try {
      const socket = this;
      const { peerId, roomId, micOn } = data;
      const { peer, room } = getDefaultRoomData(
        peerId,
        roomId,
        "consumerResumeController"
      );

      if (!micOn) {
        const producerId = peer.audioProducer.id;
        room.consumers = room.consumers
          .map((c) => {
            c.producerId === producerId && safeClose(c);
            return c;
          })
          .filter((c) => c.producerId !== producerId);

        safeClose(peer.audioProducer);
        peer.audioProducer = null;
      }

      const ids = room.peers.filter((p) => p.isJoined).map((p) => p.socketId);

      if (ids.length > 0) {
        socket.to(ids).emit("peer:toggleMic", peer.id, micOn);
      }

      callback?.({
        ok: true,
        data: null,
      });
    } catch (err) {}
  };
