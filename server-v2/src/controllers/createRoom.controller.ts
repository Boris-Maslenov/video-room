import { HandleParameters } from "../types";
import { createRoomService } from "../services/room.service";
import { pick } from "../utils/dataUtils";

import { subscribeVolumes } from "../utils/mediaUtils";

/**
 * Создает новую комнату.
 */
export const createRoom: (
  ...args: HandleParameters<"createRoom">
) => Promise<void> = async function (_, callback, io) {
  try {
    const room = await createRoomService();

    // Отправляем индикатор говорящего всем пирам в комнате
    subscribeVolumes(room, io);

    callback?.({
      ok: true,
      data: {
        ...pick(room, ["id", "createdAt"]),
      },
    });
  } catch (err) {
    callback?.({
      ok: false,
      error: { message: err?.message ?? "Ошибка создания комнаты!" },
    });
  }
};
