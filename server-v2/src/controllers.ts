import { HandleParameters } from "./types";
import { getRoom } from "./models/room";
import { getPeer } from "./models/peer";
import { createPeerService } from "./services/peer.service";
import { createRoomService, joinRoomService } from "./services/room.service";
import { pick } from "./utils/dataUtils";
import { createWebRtcTransport } from "./utils/webRtcUtils";

/**
 * Создает новую комнату.
 */

export const createRoomController: (
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

/**
 * Создает нового пира (не подключает)
 */

export const createPeerController: (
  ...args: HandleParameters<"createPeer">
) => void = async function (data, callback) {
  try {
    const { roomId, name, isOwner } = data;
    const peer = createPeerService(roomId, name, this.id, isOwner);
    callback?.({
      ok: true,
      data: {
        ...pick(peer, [
          "id",
          "mediaState",
          "name",
          "roomId",
          "socketId",
          "isJoined",
          "rtpCapabilities",
        ]),
      },
    });
  } catch (err) {
    callback?.({
      ok: false,
      error: { message: err?.message ?? "Ошибка создания пира!" },
    });
  }
};

/**
 * Добавление пира в комнату (до отправки или подписки на медиапотоки)
 * после того как комната создана, пир создан и настало время сравнить rtpCapabilities роутера и клиента
 */

export const joinRoomController: (
  ...args: HandleParameters<"joinRoom">
) => void = function (data, callback) {
  try {
    const { peerId, roomId, rtpCapabilities } = data;
    const { peer, room } = joinRoomService(roomId, peerId, rtpCapabilities);
    callback?.({
      ok: true,
      data: {
        ...pick(peer, [
          "id",
          "mediaState",
          "name",
          "roomId",
          "socketId",
          "isJoined",
          "rtpCapabilities",
        ]),
      },
    });
  } catch (err) {
    callback?.({
      ok: false,
      error: { message: err?.message ?? "Ошибка добавления пира в комнату!" },
    });
  }
};

/**
 * Этапы подключения пира:
 *
 *
 *
 * 1. Запрос Router Rtp Capabilities
 *
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

/**
 * 2. Создание produce transport
 *
 */

export const createSendTransport: (
  ...args: HandleParameters<"createSendTransport">
) => void = async function (data, callback) {
  try {
    const { peerId } = data;
    const peer = getPeer(peerId);
    const room = getRoom(peer.roomId);
    const { transport, transportParams } = await createWebRtcTransport(
      room.router
    );

    // updatePeer({ ...peer, sendTransport: transport });

    callback?.({
      ok: true,
      data: {
        transportParams,
      },
    });
  } catch (err) {
    callback?.({
      ok: false,
      error: { message: err?.message ?? "" },
    });
  }
};

/**
 * 3. connect produce transport
 *
 */

export const connectSendTransport: (
  ...args: HandleParameters<"connectSendTransport">
) => void = async function (data, callback) {
  try {
    const { dtlsParameters, peerId } = data;
    const peer = getPeer(peerId);

    if (!peer.sendTransport) {
      throw new Error(`У пира ${peerId} отсутствует producer transport`);
    }

    await peer.sendTransport.connect({
      dtlsParameters,
    });

    callback?.({
      ok: true,
      data: null,
    });
  } catch (err) {
    callback?.({
      ok: false,
      error: {
        message: err?.message ?? "Ошибка подключения Producer Transport",
      },
    });
  }
};

/**
 * 4. Produce
 *
 */

export const produce: (...args: HandleParameters<"produce">) => void =
  async function (data, callback) {
    const { peerId, kind, rtpParameters } = data;
    try {
      const peer = getPeer(peerId);

      switch (kind) {
        case "video": {
          peer.videoProducer = await peer.sendTransport.produce({
            kind,
            rtpParameters,
          });
          callback?.({
            ok: true,
            data: { id: peer.videoProducer.id },
          });
          break;
        }
        case "audio": {
          peer.audioProducer = await peer.sendTransport.produce({
            kind,
            rtpParameters,
          });
          callback?.({
            ok: true,
            data: { id: peer.audioProducer.id },
          });
          break;
        }
        default: {
          break;
        }
      }
    } catch (err) {
      callback?.({
        ok: false,
        error: {
          message:
            err?.message ??
            `Ошибка создания продюсера ${kind} у пира ${peerId}`,
        },
      });
    }
  };
