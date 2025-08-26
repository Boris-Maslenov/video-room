import * as mediasoup from "mediasoup";
import { mediaCodecs } from "../config";
import { Room } from "../types";
import { rooms } from "../data/rooms";

/**
 * Coздает новую комнату c собственным роутером и воркером
 */

export const createRoom = async (): Promise<Room> => {
  try {
    const worker = await mediasoup.createWorker();
    const router = await worker.createRouter({ mediaCodecs });
    const ROOM_ID = "0";

    if (rooms.has(ROOM_ID)) {
      throw new Error(`Комната с id ${ROOM_ID} уже существует!`);
    }

    return {
      id: ROOM_ID,
      peers: new Map(),
      createdAt: new Date(),
      worker,
      router,
    };
  } catch (err) {
    if (err instanceof Error) {
      console.log(err.message);
    }

    throw err;
  }
};

/**
 * Возвращает комнату
 */

export const getRoom = (id: string) => {
  if (!rooms.has(id)) {
    throw new Error(`getRoom: Комната ${id} не найдена`);
  }

  return rooms.get(id);
};
