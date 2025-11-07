import { Socket } from "socket.io";
import { HandleParameters, ServerEvents } from "../types";
import { getDefaultRoomData } from "../utils/dataUtils";

export const toggleMic: (...args: HandleParameters<"toggleMic">) => void =
  async function (this: Socket<{}, ServerEvents>, data, callback) {
    console.log("toggleMic");
    try {
      const socket = this;
      const { peerId, roomId, micOn } = data;
      const { peer, room } = getDefaultRoomData(
        peerId,
        roomId,
        "consumerResumeController"
      );

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
