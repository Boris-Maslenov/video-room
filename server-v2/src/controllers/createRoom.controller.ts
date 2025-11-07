import { HandleParameters } from "../types";
import { createRoomService } from "../services/room.service";
import { pick } from "../utils/dataUtils";

/**
 * Создает новую комнату.
 */
export const createRoom: (
  ...args: HandleParameters<"createRoom">
) => Promise<void> = async function (_, callback) {
  try {
    const room = await createRoomService();
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
