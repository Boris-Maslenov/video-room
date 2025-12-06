import { HandleParameters } from "../types";
import { getDefaultRoomData, log } from "../utils/dataUtils";

export const createConsumer: (
  ...args: HandleParameters<"createConsumer">
) => void = async function (data, callback) {
  try {
    const { roomId, peerId, producerId, paused, exporterId } = data;
    // peerId = remotePeerId id пира, к которому привязан producerId

    if (!producerId) {
      const message = "producerId обязательное поле";
      callback?.({
        ok: false,
        error: { message },
      });

      throw new Error(message);
    }

    const { room, peer } = getDefaultRoomData(peerId, roomId);
    const rtpCapabilities = peer.rtpCapabilities;

    if (!room.router.canConsume({ producerId, rtpCapabilities })) {
      const message = "RTP Capabilities not supported";
      callback?.({
        ok: false,
        error: { message },
      });

      throw new Error(message);
    }

    const newConsumer = await peer.recvTransport.consume({
      producerId,
      rtpCapabilities,
      paused,
      appData: { peerId, exporterId },
    });

    room.consumers.push(newConsumer);

    callback?.({
      ok: true,
      data: {
        id: newConsumer.id,
        rtpParameters: newConsumer.rtpParameters,
        kind: newConsumer.kind,
        producerId,
      },
    });
  } catch (err) {
    callback?.({
      ok: false,
      error: { message: `createConsumer error: ${err?.message ?? ""}` },
    });
  }
};
