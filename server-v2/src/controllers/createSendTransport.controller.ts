import { updatePeer } from "../models/room";
import { HandleParameters } from "../types";
import { getDefaultRoomData } from "../utils/dataUtils";
import { createWebRtcTransport } from "../utils/webRtcUtils";

/**
 * Создает SEND Transport у пира
 */
export const createSendTransport: (
  ...args: HandleParameters<"createSendTransport">
) => void = async function (data, callback) {
  try {
    const { peerId, roomId } = data;
    const { room, peer } = getDefaultRoomData(peerId, roomId);
    const { transport, transportParams } = await createWebRtcTransport(
      room.router
    );

    updatePeer(roomId, { ...peer, sendTransport: transport });

    callback?.({
      ok: true,
      data: {
        transportParams,
      },
    });
  } catch (err) {
    callback?.({
      ok: false,
      error: { message: err?.message ?? "" },
    });
  }
};
