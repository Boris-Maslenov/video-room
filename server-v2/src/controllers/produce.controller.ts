import { getPeer, getRoom, updatePeer } from "../models/room";
import { HandleParameters } from "../types";
import { subscribeProdClose, subscribeProdQuaity } from "../utils/mediaUtils";

export const produce: (...args: HandleParameters<"produce">) => void =
  async function (data, callback) {
    const socket = this;
    const io = socket.nsp.server;
    const { roomId, peerId, kind, rtpParameters, appData } = data;
    // TODO: kind можно убрать. Актуально appData.source
    const { source } = appData;
    try {
      const room = getRoom(roomId);
      const peer = getPeer(roomId, peerId);

      switch (source) {
        case "video": {
          peer.videoProducer = await peer.sendTransport.produce({
            kind,
            rtpParameters,
            appData: { source: "video" },
          });

          subscribeProdQuaity(room, peer, peer.videoProducer, "video", io);

          subscribeProdClose(room, peer, peer.videoProducer);

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

          subscribeProdQuaity(room, peer, peer.audioProducer, "audio", io);

          subscribeProdClose(room, peer, peer.audioProducer);

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

          subscribeProdClose(room, peer, peer.screenProducer);

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
