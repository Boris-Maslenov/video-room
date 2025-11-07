import { getPeer } from "../models/room";
import { HandleParameters } from "../types";

export const connectSendTransport: (
  ...args: HandleParameters<"connectSendTransport">
) => void = async function (data, callback) {
  try {
    const { dtlsParameters, peerId, roomId } = data;
    const peer = getPeer(roomId, peerId);

    if (!peer.sendTransport) {
      throw new Error(`У пира ${peerId} отсутствует producer transport`);
    }

    await peer.sendTransport.connect({
      dtlsParameters,
    });

    callback?.({
      ok: true,
      data: null,
    });
  } catch (err) {
    callback?.({
      ok: false,
      error: {
        message: err?.message ?? "Ошибка подключения Producer Transport",
      },
    });
  }
};
