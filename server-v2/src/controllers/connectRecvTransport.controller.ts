import { getPeer } from "../models/room";
import { HandleParameters } from "../types";

export const connectRecvTransport: (
  ...args: HandleParameters<"connectRecvTransport">
) => void = async function (data, callback) {
  try {
    const { dtlsParameters, peerId, roomId } = data;
    const peer = getPeer(roomId, peerId);

    if (!peer.recvTransport) {
      throw new Error(`У пира ${peerId} отсутствует recv transport!`);
    }

    await peer.recvTransport.connect({
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
        message: err?.message ?? "Ошибка подключения Recv Transport",
      },
    });
  }
};
