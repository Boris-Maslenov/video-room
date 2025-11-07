import { updatePeer } from "../models/room";
import { HandleParameters } from "../types";
import { getDefaultRoomData } from "../utils/dataUtils";
import { createWebRtcTransport } from "../utils/webRtcUtils";

export const createRecvTransport: (
  ...args: HandleParameters<"createRecvTransport">
) => void = async function (data, callback) {
  try {
    const { peerId, roomId } = data;
    const { room, peer } = getDefaultRoomData(peerId, roomId);
    const { transport, transportParams } = await createWebRtcTransport(
      room.router
    );

    updatePeer(roomId, { ...peer, recvTransport: transport });

    callback?.({
      ok: true,
      data: { transportParams },
    });
  } catch (err) {
    callback?.({
      ok: false,
      error: { message: err?.message ?? "" },
    });
  }
};
