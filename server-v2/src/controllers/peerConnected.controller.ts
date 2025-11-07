import { Socket } from "socket.io";
import { HandleParameters, ServerEvents, Source } from "../types";
import { getDefaultRoomData, pick } from "../utils/dataUtils";

/**
 * Сигнал, что пир отправил медиапотоки, можно подписываться на его продюсеры
 */
export const peerConnected: (
  ...args: HandleParameters<"peerConnected">
) => void = async function (this: Socket<{}, ServerEvents>, data, callback) {
  try {
    const { peerId, roomId } = data;
    const { room, peer } = getDefaultRoomData(peerId, roomId);

    const allPeerIds = room.peers
      .filter((p) => p.isJoined && p.id !== peer.id)
      .map((p) => p.socketId);

    if (allPeerIds.length > 0) {
      this.to(allPeerIds)
        .except(peer.socketId)
        .emit("peer:ready", {
          ...pick(peer, [
            "id",
            "roomId",
            "name",
            "socketId",
            "isJoined",
            "micOn",
            "camOn",
          ]),
          producersData: [
            peer.audioProducer,
            peer.videoProducer,
            peer.screenProducer,
          ]
            .filter(Boolean)
            .map((p) => ({
              producerId: p.id,
              source: p.appData.source as Source,
            })),
          status: "online",
        });
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
