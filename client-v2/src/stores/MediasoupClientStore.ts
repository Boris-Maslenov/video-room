import { makeAutoObservable } from "mobx";
import { RootStore } from "./RootStore";
import { Device } from "mediasoup-client";
import type {
  RtpCapabilities,
  TransportOptions,
  Transport,
  Producer,
} from "mediasoup-client/types";
import { apiSend } from "../api/api";
import { KindType } from "../api/api.types";

export type MediaDevice = {
  deviceId: string;
  label: string;
  groupId: string;
};

type Peer = {
  id: string;
  name: string;
  socketId: string;
  roomId: string;
  isJoined: boolean;
};

type ProducerKey = "audioProducer" | "videoProducer";

const printError = (err: unknown) => {
  console.error(err);
};

type peerStatusTypes = "offline" | "connecting" | "joined" | "online";

const producersMap = {
  audio: "audioProducer",
  video: "videoProducer",
} as Record<KindType, ProducerKey>;

class MediasoupClientStore {
  root: RootStore;
  peerId?: string;
  peerName?: string;
  roomId?: string;
  isJoined: boolean = false;
  peerStatus: peerStatusTypes = "offline";
  localMediaStream: MediaStream | null = null;
  device: Device;
  sendTransport: Transport | null = null;
  recvTransport: Transport | null = null;
  videoProducer: Producer | null = null;
  audioProducer: Producer | null = null;

  constructor(root: RootStore) {
    this.root = root;
    this.device = new Device();

    makeAutoObservable(this);
  }

  private setLocalProducer(produer: Producer) {
    // TODO: навесить события на продюсер
    // producer.on('transportclose', ...) — транспорт умер → действуем (чистим состояние).
    // producer.on('trackended', ...) — исходный MediaStreamTrack закончился (пользователь «Stop sharing», камера пропала) → действуем (закрываем продюсер).
    // Observer:
    // producer.observer.on('close', ...) — продюсер уже закрыт → просто синхронизируем UI/стор.
    // producer.observer.on('pause', ...) — уже на паузе → обновляем индикаторы.
    // producer.observer.on('resume', ...) — уже возобновлён → обновляем индикаторы.
    // producer.observer.on('trackended', ...) — факт «трек закончился» (для логов).
    const kind = produer.kind as KindType;
    let existingProducer = this[producersMap[kind]];

    if (existingProducer) {
      (this[producersMap[kind]] as Producer).close();
      this[producersMap[kind]] = null;
    }

    this[producersMap[kind]] = produer;
  }

  private deleteLocalProducer(produer: Producer) {
    const kind = produer.kind as KindType;
    let existingProducer = this[producersMap[kind]];

    if (existingProducer) {
      (this[producersMap[kind]] as Producer).close();
      this[producersMap[kind]] = null;
    }
  }

  getDefaultRoomData() {
    if (!this.roomId || !this.peerId) {
      throw new Error(
        "getDefaultRoomData: this.roomId | !this.peerId not found"
      );
    }
    return { roomId: this.roomId, peerId: this.peerId };
  }

  /**
   * gerRouterRtpCapabilities
   * Запрашивает кодеки и RTP-расширения которые поддерживает Router
   */
  async gerRouterRtpCapabilities(roomId: string) {
    const { data } = await apiSend<RtpCapabilities>(
      "getRouterRtpCapabilities",
      { roomId }
    );
    return data;
  }

  /**
   * loadDevice
   * Собирает возможности браузера, сверяет иx с возможностями роутера, строит профили отправки приема
   */
  private async loadDevice(routerRtpCapabilities: RtpCapabilities) {
    if (!this.device) {
      throw new Error("device not created");
    }

    if (this.device.loaded) {
      return this.device.rtpCapabilities;
    }

    await this.device.load({ routerRtpCapabilities });

    return this.device.rtpCapabilities;
  }

  /**
   * joinRoom
   * Отправляем device.rtpCapabilities если все ок то пир считается добавленным в комнату
   */
  async joinRoom(
    roomId: string,
    peerId: string,
    rtpCapabilities: RtpCapabilities
  ) {
    const { data } = await apiSend<Peer>("joinRoom", {
      roomId,
      peerId,
      rtpCapabilities,
    });

    return data;
  }

  /**
   * createSendTransport
   * Создаем produce transport и навешививаем события 'connect' и 'produce',
   * Эти события сработают только после transport.produce
   * 'connect' сработает только при первом transport.produce
   */
  private async createSendTransport() {
    if (!this.device) {
      throw new Error("createSendTransport: device not created");
    }

    const { data } = await apiSend<{ transportParams: TransportOptions }>(
      "createSendTransport",
      this.getDefaultRoomData()
    );

    this.sendTransport = this.device.createSendTransport(data.transportParams);

    this.sendTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        try {
          await apiSend("connectSendTransport", {
            dtlsParameters,
            ...this.getDefaultRoomData(),
          });
          callback();
        } catch (error) {
          if (error instanceof Error) {
            errback(error);
          }
        }
      }
    );

    this.sendTransport.on(
      "produce",
      async ({ kind, rtpParameters, appData }, callback, errback) => {
        // appData передаем в sendTransport.produce()
        try {
          const { data } = await apiSend<{ id: string }>("produce", {
            kind,
            rtpParameters,
            ...this.getDefaultRoomData(),
          });
          callback(data);
        } catch (error) {
          if (error instanceof Error) {
            errback(error);
          }
        }
      }
    );

    this.sendTransport.on("connectionstatechange", (state) => {
      // connected (ICE кандидаты собрались, DTLS установлено) не зависит от produce
      if (state === "connected") {
      }
      if (state === "disconnected" || state === "failed") {
      }
    });
  }

  /**
   * produceMediaTrack
   * Создает продюсер. Отправка медиа потока в комнату
   */
  private async produceMediaTrack(track: MediaStreamTrack) {
    if (!this.sendTransport) {
      throw new Error("sendTransport not found");
    }

    try {
      const produer = await this.sendTransport.produce({ track });
      this.setLocalProducer(produer);
    } catch (err) {
      if (err instanceof Error) {
        throw Error;
      }
    }
  }

  /**
   * createRoom
   * Создание новой комнаты
   */
  async createRoom(peerName: string) {
    try {
      // 1 создаем пуствую комнату
      const { data: dataRoom } = await apiSend<{
        id: string;
        createAt: string;
      }>("createRoom");
      this.roomId = dataRoom.id;

      // 2 Запрос Rtp Capabilities
      const routerRtpCapabilities = await this.gerRouterRtpCapabilities(
        dataRoom.id
      );

      // 3 создаем пира в этой комнате
      const { data: dataPeer } = await apiSend<Peer>("createPeer", {
        roomId: dataRoom.id,
        name: peerName,
      });
      this.peerId = dataPeer.id;

      // 4 загружаем Device
      const rtpCapabilities = await this.loadDevice(routerRtpCapabilities);

      // 5 Сервер добавит пира в комнату (isJoined = true), после чего можно подписываться и передавать Media
      const peer = await this.joinRoom(
        dataRoom.id,
        dataPeer.id,
        rtpCapabilities
      );

      await this.createSendTransport();

      const mediaTracks = this.root.mediaDevices.getMediaTracks();

      if (mediaTracks.length) {
        await Promise.all(
          mediaTracks.map((track) => this.produceMediaTrack(track))
        );
      }
    } catch (err) {
      printError(err);
    }
  }
}
export default MediasoupClientStore;
