import { HandleParameters } from "../types";
import { getDefaultRoomData } from "../utils/dataUtils";

/**
 * Клиент поставил на паузу консюмеры
 */
export const consumerPause: (
  ...args: HandleParameters<"consumerPause">
) => void = async function (data, callback) {
  try {
    const { peerId, roomId, consumerIds } = data;
    const { room } = getDefaultRoomData(
      peerId,
      roomId,
      "consumerPauseController"
    );

    const setIds = new Set(consumerIds);

    room.consumers.forEach((consumer) => {
      if (setIds.has(consumer.id)) {
        consumer.pause();
      }
    });

    callback?.({
      ok: true,
      data: null,
    });
  } catch (err) {}
};
