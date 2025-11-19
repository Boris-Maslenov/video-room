import { NetworkQuality, Room, Peer } from "../types";
import { Server } from "socket.io";
import { getRoom, getPeer, updatePeer } from "../models/room";
import { log } from "./dataUtils";
import { Producer } from "mediasoup/node/lib/ProducerTypes";

export const safeClose = (...objs: ({ close: () => void } | null)[]) => {
  objs.forEach((o) => {
    o?.close();
  });
};

export const subscribeVolumes = (room: Room, io: Server) => {
  if (!room || !io) {
    return;
  }

  room.audioObserver.on("volumes", (volumes) => {
    const r = getRoom(room.id);
    const volumeData = volumes;
    const volumeProducerIds = volumeData.map((v) => v.producer.id);
    const speakers = [] as Peer[];

    r.peers.forEach((p) => {
      if (volumeProducerIds.includes(p.audioProducer.id)) {
        speakers.push(p);
      }
    });

    const speakerIds = speakers.map((p) => p.id);
    const ids = r.peers.filter((p) => p.isJoined).map((p) => p.socketId);

    if (ids.length > 0) {
      io.to(ids).emit("room:activeSpeaker", speakerIds);
    }
  });
};

export const subscribeProdQuaity = (
  room: Room,
  peer: Peer,
  producer: Producer,
  qKey: "video" | "audio" | "screen",
  io: Server
) => {
  if (!room || !peer) {
    return;
  }

  producer.observer.once("close", () => {
    log("close");
    const p = getPeer(room.id, peer.id);
    const r = getRoom(room.id);

    updatePeer(room.id, {
      ...p,
      networkQuality: { ...p.networkQuality, [qKey]: undefined },
    });

    const ids = r.peers.filter((p) => p.isJoined).map((p) => p.socketId);

    if (ids.length > 0) {
      io.to(ids).emit("peer:updateNetworkQuality", peer.id, {
        ...p.networkQuality,
        [qKey]: undefined,
      });
    }
  });

  producer.on("score", (data) => {
    // Без симулькаста 1 элемент в массиве
    const score = data[0].score;
    const p = getPeer(room.id, peer.id);
    const r = getRoom(room.id);

    if (peer.name === "111") {
      log("score", qKey, score);
    }

    updatePeer(room.id, {
      ...p,
      networkQuality: { ...p.networkQuality, [qKey]: score },
    });

    const ids = r.peers.filter((p) => p.isJoined).map((p) => p.socketId);

    if (ids.length > 0) {
      io.to(ids).emit("peer:updateNetworkQuality", peer.id, {
        ...p.networkQuality,
        [qKey]: score,
      });
    }
  });
};
