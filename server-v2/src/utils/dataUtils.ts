import util from "util";
import { getRoom, getPeer } from "../models/room";
import { COLORS } from "../config";

type ColorName = keyof typeof COLORS;

/**
 * Возьмет только переданные ключи из обьекта. Ключи передаются массивом
 */
export const pick = <T extends {}, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (Object.hasOwn(obj, key)) {
      result[key] = obj[key];
    }
  }

  return result;
};

// chalk вывод в консоль зветного текста
export const log = (...args: any[] | [...any, ColorName]) => {
  const colors = Object.keys(COLORS);
  const foundColor = args.at(-1) as ColorName;

  if (colors.includes(foundColor)) {
    return console.log(
      ...args.slice(0, -1).map(
        (arg) =>
          `${COLORS[foundColor]}${util.inspect(arg, {
            depth: 10,
          })}${COLORS.reset}`
      )
    );
  }

  return console.log(
    ...args.map((arg) => util.inspect(arg, { depth: null, colors: true }))
  );
};

export const logError = (...args: any[]) => log(...args, "red");

/**
 * Вернет комнату и пира
 */
export const getDefaultRoomData = (
  peerId: string,
  roomId: string,
  context = "defaultRoomData"
) => {
  if (!peerId || !roomId) {
    throw new Error(`${context} error: arguments not found`);
  }
  const peer = getPeer(roomId, peerId);
  const room = getRoom(roomId);

  if (!peer) {
    throw new Error(`${context} error: peer not found`);
  }

  if (!room) {
    throw new Error(`${context} error: room not found`);
  }

  return { peer, room };
};
