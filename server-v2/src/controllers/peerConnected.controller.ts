import { HandleParameters, Source } from "../types";
import { getDefaultRoomData, pick } from "../utils/dataUtils";

/**
 * Сигнал, что пир отправил медиапотоки, можно подписываться на его продюсеры
 */
export const peerConnected: (
  ...args: HandleParameters<"peerConnected">
) => void = async function (data, callback, _, socket) {
  try {
    const { peerId, roomId } = data;
    const { room, peer } = getDefaultRoomData(peerId, roomId);
    const allSockets = room.peers.map((p) => p.socketId);

    if (allSockets.length > 0) {
      socket.to(allSockets).emit("peer:ready", {
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
