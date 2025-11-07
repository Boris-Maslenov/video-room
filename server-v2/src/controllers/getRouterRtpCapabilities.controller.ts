import { getRoom } from "../models/room";
import { HandleParameters } from "../types";

/**
 * Запрос Router Rtp Capabilities
 */
export const getRouterRtpCapabilities: (
  ...args: HandleParameters<"getRouterRtpCapabilities">
) => void = function (data, callback) {
  try {
    const { roomId } = data;
    const rtpCapabilities = getRoom(roomId).router.rtpCapabilities;
    callback?.({
      ok: true,
      data: {
        ...rtpCapabilities,
      },
    });
  } catch (err) {
    callback?.({
      ok: false,
      error: { message: err?.message ?? "rtp сapabilities не получены" },
    });
  }
};
