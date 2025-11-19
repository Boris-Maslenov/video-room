import { HandleParameters, Peer } from "../types";
import { createRoomService } from "../services/room.service";
import { log, pick } from "../utils/dataUtils";
import { findProducer, getRoom } from "../models/room";
import { Socket } from "socket.io";
import { subscribeVolumes } from "../utils/mediaUtils";

/**
 * Создает новую комнату.
 */
export const createRoom: (
  ...args: HandleParameters<"createRoom">
) => Promise<void> = async function (this: Socket, _, callback) {
  try {
    const socket = this;
    const io = socket.nsp.server;
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
