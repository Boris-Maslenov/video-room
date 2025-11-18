import { HandleParameters, Source } from "../types";
import { joinRoomService } from "../services/room.service";
import { pick } from "../utils/dataUtils";

/**
 * Добавление пира в комнату (до отправки или подписки на медиапотоки)
 * после того как комната создана, пир создан и настало время сравнить rtpCapabilities роутера и клиента
 */
export const joinRoom: (...args: HandleParameters<"joinRoom">) => void =
  function (data, callback) {
    try {
      const { peerId, roomId, rtpCapabilities } = data;
      const { peer, room } = joinRoomService(roomId, peerId, rtpCapabilities);
      const socket = this;
      callback?.({
        ok: true,
        data: {
          peer: pick(peer, [
            "id",
            "name",
            "roomId",
            "socketId",
            "isJoined",
            "rtpCapabilities",
            "camOn",
            "micOn",
          ]),
          remotePeers: room.peers
            .filter((p) => p.id !== peerId)
            .map((p) => ({
              ...pick(p, [
                "id",
                "roomId",
                "name",
                "socketId",
                "isJoined",
                "camOn",
                "micOn",
                "networkQuality",
              ]),
              producersData: [
                p.audioProducer,
                p.videoProducer,
                p.screenProducer,
              ]
                .filter(Boolean)
                .map((p) => ({
                  producerId: p.id,
                  source: p.appData.source as Source,
                })),
              status: "online",
            })),
        },
      });
      const ids = room.peers.filter((p) => p.isJoined).map((p) => p.socketId);

      if (ids.length > 0) {
        socket.to(ids).emit("room:updateCount", ids.length); // всем кроме меня
        socket.emit("room:updateCount", ids.length); // мне
      }
    } catch (err) {
      callback?.({
        ok: false,
        error: { message: err?.message ?? "Ошибка добавления пира в комнату!" },
      });
    }
  };
