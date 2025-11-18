import { getPeer, getRoom, updatePeer } from "../models/room";
import { HandleParameters } from "../types";
import { log } from "../utils/dataUtils";
import { calcNetworkQuality } from "../utils/mediaUtils";

export const produce: (...args: HandleParameters<"produce">) => void =
  async function (data, callback) {
    const socket = this;
    const io = socket.nsp.server;
    const { roomId, peerId, kind, rtpParameters, appData } = data;
    // TODO: kind можно убрать. Актуально appData.source
    const { source } = appData;
    try {
      const peer = getPeer(roomId, peerId);
      switch (source) {
        case "video": {
          peer.videoProducer = await peer.sendTransport.produce({
            kind,
            rtpParameters,
            appData: { source: "video" },
          });

          peer.videoProducer.on("score", (data) => {
            // Без симулькаста 1 элемент в массиве
            const score = data[0].score;
            const p = getPeer(roomId, peerId);
            const r = getRoom(roomId);
            const newNetworkQuality = calcNetworkQuality(score);

            if (peer.name === "111") {
              log("score videoProducer", peer.name, score);
            }

            if (newNetworkQuality !== p.networkQuality) {
              updatePeer(roomId, {
                ...p,
                networkQuality: newNetworkQuality,
              });

              const ids = r.peers
                .filter((p) => p.isJoined)
                .map((p) => p.socketId);

              if (ids.length > 0) {
                io.to(ids).emit(
                  "peer:updateNetworkQuality",
                  peer.id,
                  newNetworkQuality
                );
              }
            }
          });

          callback?.({
            ok: true,
            data: { id: peer.videoProducer.id },
          });

          break;
        }
        case "audio": {
          peer.audioProducer = await peer.sendTransport.produce({
            kind,
            rtpParameters,
            appData: { source: "audio" },
          });
          // добавляем audioProducer для измерения уровня громкости
          const room = getRoom(roomId);
          room.audioObserver.addProducer({ producerId: peer.audioProducer.id });

          peer.audioProducer.on("score", (data) => {
            // Без симулькаста 1 элемент в массиве
            const score = data[0].score;
            const p = getPeer(roomId, peerId);
            const r = getRoom(roomId);
            const newNetworkQuality = calcNetworkQuality(score);

            if (peer.name === "111") {
              log("score audioProducer", peer.name, score);
            }

            if (newNetworkQuality !== p.networkQuality) {
              updatePeer(roomId, {
                ...p,
                networkQuality: newNetworkQuality,
              });

              const ids = r.peers
                .filter((p) => p.isJoined)
                .map((p) => p.socketId);

              if (ids.length > 0) {
                io.to(ids).emit(
                  "peer:updateNetworkQuality",
                  peer.id,
                  newNetworkQuality
                );
              }
            }
          });

          callback?.({
            ok: true,
            data: { id: peer.audioProducer.id },
          });
          break;
        }
        case "screen": {
          peer.screenProducer = await peer.sendTransport.produce({
            kind,
            rtpParameters,
            appData: { source: "screen" },
          });
          callback?.({
            ok: true,
            data: { id: peer.screenProducer.id },
          });
          break;
        }
        default: {
          break;
        }
      }
    } catch (err) {
      callback?.({
        ok: false,
        error: {
          message:
            err?.message ??
            `Ошибка создания продюсера ${kind} у пира ${peerId}`,
        },
      });
    }
  };
