import { Socket } from "socket.io";
import { HandleParameters, ServerEvents } from "../types";
import { getDefaultRoomData } from "../utils/dataUtils";

/**
 * Клиент возобновил консюмеры
 */
export const consumerResume: (
  ...args: HandleParameters<"consumerResume">
) => void = async function (this: Socket<{}, ServerEvents>, data, callback) {
  try {
    const { peerId, roomId, consumerIds } = data;
    const { room } = getDefaultRoomData(
      peerId,
      roomId,
      "consumerResumeController"
    );

    const setIds = new Set(consumerIds);

    room.consumers.forEach((consumer) => {
      if (setIds.has(consumer.id)) {
        consumer.requestKeyFrame();
        consumer.resume();
      }
    });

    callback?.({
      ok: true,
      data: null,
    });
  } catch (err) {}
};
