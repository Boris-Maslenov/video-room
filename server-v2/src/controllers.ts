import { HandleParameters } from "./types";
import { createRoom, getRoom } from "./models/room";
import { getPeer, updatePeer } from "./models/peer";
import { createPeer as createPeerService } from "./services/peer.service";
import { pick } from "./utils/dataUtils";
import { createWebRtcTransport } from "./utils/webRtcUtils";

/**
 * Создает новую комнату.
 */

export const createRoomController: (
  ...args: HandleParameters<"createRoom">
) => Promise<void> = async function (_, callback) {
  try {
    const room = await createRoom();
    callback?.({
      ok: true,
      data: {
        room: pick(room, ["id", "createdAt"]),
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
        peer,
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
 */

export const joinPeerController: (
  ...args: HandleParameters<"joinPeer">
) => void = function () {};

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
        rtpCapabilities,
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

    updatePeer({ ...peer, sendTransport: transport });

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
