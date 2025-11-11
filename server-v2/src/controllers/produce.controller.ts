import { getPeer, getRoom } from "../models/room";
import { HandleParameters } from "../types";

export const produce: (...args: HandleParameters<"produce">) => void =
  async function (data, callback) {
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
