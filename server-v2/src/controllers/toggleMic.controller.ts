import { HandleParameters } from "../types";
import { getDefaultRoomData } from "../utils/dataUtils";
import { updatePeer } from "../models/room";

type ToggleMic = (...args: HandleParameters<"toggleMic">) => void;

export const toggleMic: ToggleMic = async (data, callback, _, socket) => {
  try {
    const { peerId, roomId, micOn } = data;
    const { peer, room } = getDefaultRoomData(
      peerId,
      roomId,
      "consumerResumeController"
    );

    updatePeer(roomId, { ...peer, micOn });

    const ids = room.peers.filter((p) => p.isJoined).map((p) => p.socketId);

    if (ids.length > 0 && socket) {
      socket.to(ids).emit("peer:toggleMic", peer.id, micOn);
    }

    callback?.({
      ok: true,
      data: null,
    });
  } catch (err) {}
};
