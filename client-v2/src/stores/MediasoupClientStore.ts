import { makeAutoObservable, runInAction } from "mobx";
import { RootStore } from "./RootStore";
import { Device } from "mediasoup-client";
import type {
  RtpCapabilities,
  TransportOptions,
  Transport,
  Producer,
  Consumer,
  RtpParameters,
  ConsumerOptions,
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

type NetworkPeerStatus = "offline" | "connecting" | "online";

type RemotePeer = {
  id: string;
  roomId: string;
  name: string;
  producerIds: string[];
  socketId: string;
  isJoined: boolean;
  status: NetworkPeerStatus;
};

type ClientRemotePeer = RemotePeer & { consumers: Consumer[] };

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
  peerStatus: NetworkPeerStatus = "offline";
  localMediaStream: MediaStream | null = null;
  device: Device;
  sendTransport: Transport | null = null;
  recvTransport: Transport | null = null;
  videoProducer: Producer | null = null;
  audioProducer: Producer | null = null;
  remotePeers: ClientRemotePeer[] = [];

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
    let existingProducer = Boolean(this[producersMap[kind]]);

    if (existingProducer) {
      (this[producersMap[kind]] as Producer).close();
      this[producersMap[kind]] = null;
    }
  }

  private get defaultRoomData() {
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
      this.defaultRoomData
    );

    this.sendTransport = this.device.createSendTransport(data.transportParams);

    this.sendTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        try {
          await apiSend("connectSendTransport", {
            dtlsParameters,
            ...this.defaultRoomData,
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
            ...this.defaultRoomData,
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
   * produce
   * Создает продюсер. Отправка медиа потока в комнату
   */
  private async produce(track: MediaStreamTrack) {
    if (!this.sendTransport) {
      throw new Error("sendTransport not found");
    }

    try {
      const producer = await this.sendTransport.produce({ track });
      this.setLocalProducer(producer);
    } catch (err) {
      if (err instanceof Error) {
        throw Error;
      }
    }
  }

  /**
   * consume
   * Создает консюмеры. Подписка на медиа потоки других участников
   */
  private async consume() {
    const remoteProducersData = this.remotePeers.reduce<
      { remotePeerId: string; producerId: string }[]
    >((acc, cur) => {
      const res = cur.producerIds.map((val) => ({
        remotePeerId: cur.id,
        producerId: val,
      }));

      acc.push(...res);
      return acc;
    }, []);

    const { roomId, peerId } = this.defaultRoomData;

    return Promise.all(
      remoteProducersData.map((p) =>
        this.createConsumer(roomId, peerId, p.remotePeerId, p.producerId)
      )
    );
  }

  /**
   * joinRoom
   * Отправляем device.rtpCapabilities если все ок то пир считается добавленным в комнату (сервер сделает рассылку о новом пире)
   */
  private async joinRoom(
    roomId: string,
    peerId: string,
    rtpCapabilities: RtpCapabilities
  ) {
    const { data } = await apiSend<{
      remotePeers: RemotePeer[];
      peer: Peer;
    }>("joinRoom", {
      roomId,
      peerId,
      rtpCapabilities,
    });

    return data;
  }

  /**
   * createRecvTransport
   * Создает транспорт для приема медиа
   */
  private async createRecvTransport() {
    const { data } = await apiSend<{ transportParams: TransportOptions }>(
      "createRecvTransport",
      this.defaultRoomData
    );
    this.recvTransport = this.device.createRecvTransport(data.transportParams);

    this.recvTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        try {
          console.log("recvTransport connect");
          await apiSend("connectRecvTransport", {
            dtlsParameters,
            ...this.defaultRoomData,
          });
          callback();
        } catch (error) {
          if (error instanceof Error) {
            console.log("err", error);
            errback(error);
          }
        }
      }
    );

    this.recvTransport.on("connectionstatechange", (state) => {
      console.log("recvTransport", state);
    });
  }

  /**
   * addRemoteConsumer
   * Добавляет консюмер к пиру
   */
  private addRemoteConsumer(remotePeerId: string, consumer: Consumer) {
    const foundRemotePeer = this.remotePeers.find((p) => p.id === remotePeerId);
    if (foundRemotePeer) {
      foundRemotePeer.consumers.push(consumer);
    }
  }

  /**
   * createConsumer создает консюмер на backend и соответствующий на клиенте
   * запускается на каждом producerId
   */
  private async createConsumer(
    roomId: string,
    localPeerId: string,
    remotePeerId: string,
    producerId: string
  ) {
    if (!this.recvTransport) {
      throw new Error(`createConsumer: recvTransport not found`);
    }

    const { data } = await apiSend<{
      id: string;
      rtpParameters: RtpParameters;
      kind: KindType;
      producerId: string;
    }>("createConsumer", {
      rtpCapabilities: this.device.rtpCapabilities,
      producerId,
      roomId,
      peerId: localPeerId,
    });

    const consumer = await this.recvTransport.consume(data);

    this.addRemoteConsumer(remotePeerId, consumer);
  }

  /**
   * high-level method
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

      console.log("createRoom: 1");

      // 2 Запрос Rtp Capabilities
      const routerRtpCapabilities = await this.gerRouterRtpCapabilities(
        dataRoom.id
      );

      console.log("createRoom: 2");

      // 3 создаем пира в этой комнате
      /**
       * Не гарантирует в будущем, что пир будет именно в этой комнате. Гарант того, что пир в комнате joinRoom
       */
      const { data: dataPeer } = await apiSend<Peer>("createPeer", {
        roomId: dataRoom.id,
        name: peerName,
      });

      console.log("createRoom: 3");

      // 4 загружаем Device
      const rtpCapabilities = await this.loadDevice(routerRtpCapabilities);

      console.log("createRoom: 4");

      // 5 Сервер добавит пира в комнату (isJoined = true), после чего можно подписываться и передавать Media
      const { peer } = await this.joinRoom(
        dataRoom.id,
        dataPeer.id,
        rtpCapabilities
      );
      this.peerId = peer.id;
      this.roomId = peer.roomId;
      console.log("createRoom: 5");

      // Пустой массив
      this.remotePeers = [];
      await this.createSendTransport();

      console.log("createRoom: 6");

      const mediaTracks = this.root.mediaDevices.getMediaTracks();

      if (mediaTracks.length) {
        await Promise.all(mediaTracks.map((track) => this.produce(track)));
      }
      console.log("createRoom: 7");
    } catch (err) {
      printError(err);
    }
  }

  /**
   * high-level method
   * enterRoom
   * Подключение к существующей комнате
   */
  async enterRoom(roomId: string, peerName: string) {
    try {
      // 1 Запрос Rtp Capabilities
      const routerRtpCapabilities = await this.gerRouterRtpCapabilities(roomId);
      console.log("enterRoom", 1);

      // 2 создаем пира
      /**
       * Не гарантирует в будущем, что пир будет именно в этой комнате. Гарант того, что пир в комнате joinRoom
       */
      const { data: dataPeer } = await apiSend<Peer>("createPeer", {
        roomId: roomId,
        name: peerName,
      });

      console.log("enterRoom", 2);

      if (!dataPeer.id || !dataPeer.roomId || !dataPeer.name) {
        throw new Error("enterRoom failed!");
      }

      // 3 загружаем Device
      const rtpCapabilities = await this.loadDevice(routerRtpCapabilities);

      console.log("enterRoom", 3);

      // 4 Сервер успешно добавил пира и вернул участников комнаты
      const { remotePeers, peer } = await this.joinRoom(
        roomId,
        dataPeer.id,
        rtpCapabilities
      );

      runInAction(() => {
        this.isJoined = true;
        this.peerId = peer.id;
        this.roomId = peer.roomId;
        this.peerName = peer.name;
        this.remotePeers = remotePeers.map((p) => ({ ...p, consumers: [] }));
      });

      console.log("enterRoom", 4);

      // 5 Создание recvtransport
      await this.createRecvTransport();

      console.log("enterRoom", 5);

      // 6 Подписка на потоки
      await this.consume();
      console.log("enterRoom", 6, "this.remotePeers: ", this.remotePeers);
    } catch (err) {
      this.clear();
      printError(err);
    }
  }

  private clear() {
    this.isJoined = false;
    this.peerId = undefined;
    this.peerName = undefined;
    this.roomId = undefined;
  }
}
export default MediasoupClientStore;
