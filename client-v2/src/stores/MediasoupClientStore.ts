import { makeAutoObservable } from "mobx";
import { RootStore } from "./RootStore";
import { Device } from "mediasoup-client";
import type {
  RtpCapabilities,
  TransportOptions,
  ConsumerOptions,
  Transport,
  Producer,
} from "mediasoup-client/types";
import { apiSend } from "../api/api";
import { KindType, ApiResult } from "../api/api.types";

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

class MediasoupClientStore {
  root: RootStore;
  peerId?: string;
  peerName?: string;
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
  async loadDevice(routerRtpCapabilities: RtpCapabilities) {
    if (!this.device) {
      throw new Error("device not created");
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
  async createSendTransport() {
    if (!this.device) {
      throw new Error("device not created");
    }
    const { data } = await apiSend<TransportOptions>("createSendTransport", {
      data: { peerId: "0" },
    });

    this.sendTransport = this.device.createSendTransport(data);

    this.sendTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        try {
          await apiSend("connectSendTransport", {
            data: { dtlsParameters, peerId: "0" },
          });
          // TODO: тут вероятно можно подать запрос на join
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
            data: { kind, rtpParameters, peerId: "0" },
          });
          callback(data);
        } catch (error) {
          if (error instanceof Error) {
            errback(error);
          }
        }
      }
    );
  }

  /**
   * produceMediaTrack
   * Создает продюсер. Отправка медиа потока в комнату
   */
  async produceMediaTrack(track: MediaStreamTrack, kind: KindType) {
    if (!this.sendTransport) {
      throw new Error("sendTransport not found");
    }

    try {
      const producersMap = {
        audio: "audioProducer",
        video: "videoProducer",
      } as Record<KindType, ProducerKey>;

      let existingProducer = this[producersMap[kind]];

      if (existingProducer) {
        existingProducer.close();
        existingProducer = null;
      }
      // TODO: навесить события на продюсер
      // producer.on('transportclose', ...) — транспорт умер → действуем (чистим состояние).
      // producer.on('trackended', ...) — исходный MediaStreamTrack закончился (пользователь «Stop sharing», камера пропала) → действуем (закрываем продюсер).
      // Observer:
      // producer.observer.on('close', ...) — продюсер уже закрыт → просто синхронизируем UI/стор.
      // producer.observer.on('pause', ...) — уже на паузе → обновляем индикаторы.
      // producer.observer.on('resume', ...) — уже возобновлён → обновляем индикаторы.
      // producer.observer.on('trackended', ...) — факт «трек закончился» (для логов).

      this[producersMap[kind]] = await this.sendTransport.produce({ track });
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
      console.log("1 создали новую комнату", dataRoom);

      // 2 создаем пира в этой комнате
      const { data: dataPeer } = await apiSend<Peer>("createPeer", {
        roomId: dataRoom.id,
        name: peerName,
      });
      console.log("2 создали пира", dataPeer);

      // 3 Запрос Rtp Capabilities
      const routerRtpCapabilities = await this.gerRouterRtpCapabilities(
        dataRoom.id
      );
      console.log("3 routerRtpCapabilities получены", routerRtpCapabilities);

      // 4 загружаем Device
      const rtpCapabilities = await this.loadDevice(routerRtpCapabilities);
      console.log("4 Device загружен", rtpCapabilities);

      // 5 Сервер добавит пира в комнату, после чего можно подписываться и передавать Media
      const data = await this.joinRoom(
        dataRoom.id,
        dataPeer.id,
        rtpCapabilities
      );
      console.log("5 Пир добавлен в комнату ура", data);
    } catch (err) {
      printError(err);
    }
  }
}
export default MediasoupClientStore;
