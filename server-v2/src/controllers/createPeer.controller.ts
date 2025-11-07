import { HandleParameters } from "../types";
import { createPeerService } from "../services/peer.service";
import { pick } from "../utils/dataUtils";

/**
 * Создает нового пира (не подключает)
 */
export const createPeer: (...args: HandleParameters<"createPeer">) => void =
  async function (data, callback) {
    try {
      const { roomId, name, micOn, camOn } = data;
      const peer = createPeerService(
        roomId,
        name,
        this.id,
        false,
        micOn,
        camOn
      );
      callback?.({
        ok: true,
        data: {
          ...pick(peer, [
            "id",
            "name",
            "roomId",
            "socketId",
            "isJoined",
            "rtpCapabilities",
            "camOn",
            "micOn",
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
