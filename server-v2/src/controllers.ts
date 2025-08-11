import { HandleParameters } from "./types";
import { createRoom } from "./services/roomServices";
import { createPeer } from "./services/peerServices";
import { rooms } from "./data/rooms";
import { pick } from "./utils/dataUtils";

/**
 * Создает новую комнату.
 */

export const createRoomController: (
  ...args: HandleParameters<"createRoom">
) => Promise<void> = async (_, callback) => {
  try {
    const room = await createRoom();

    callback({
      ok: true,
      data: {
        room: pick(room, ["id", "createdAt"]),
      },
    });
  } catch (error) {
    callback({
      ok: false,
      error: { message: error?.message ?? "Ошибка создания комнаты!" },
    });
  }
};

/**
 * Создает нового пира (не подключает)
 */

export const createPeerController: (
  ...args: HandleParameters<"createPeer">
) => void = async () => {};
