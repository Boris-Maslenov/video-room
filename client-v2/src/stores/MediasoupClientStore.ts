import { makeAutoObservable, observable, runInAction } from "mobx";
import { RootStore } from "./RootStore";
import { Device } from "mediasoup-client";
import type {
  RtpCapabilities,
  TransportOptions,
  Transport,
  Producer,
  Consumer,
  RtpParameters,
} from "mediasoup-client/types";
import { KindType, SourceType } from "../api/api.types";
import { safeClose, safeStop } from "../utils/mediaUtils";
import { SCREEN_PRODUCER_OPTIONS } from "../config";

export type MediaDevice = {
  deviceId: string;
  label: string;
  groupId: string;
};

export type Peer = {
  id: string;
  name: string;
  socketId: string;
  roomId: string;
  isJoined: boolean;
};

export type ProducerKey = "audioProducer" | "videoProducer" | "screenProducer";

export type NetworkPeerStatus = "offline" | "connecting" | "online";

export type Source = "audio" | "video" | "screen";

export type RemoteProducerData = {
  producerId: string;
  source: Source;
};

export type AppProducer = Producer<{ source: Source }>;

export type RemotePeer = {
  id: string;
  roomId: string;
  name: string;
  producersData: RemoteProducerData[];
  socketId: string;
  isJoined: boolean;
  status: NetworkPeerStatus;
};

export type ClientRemotePeer = RemotePeer & {
  consumers: Consumer[];
  mediaStream: MediaStream;
};

const producersMap = {
  audio: "audioProducer",
  video: "videoProducer",
  screen: "screenProducer",
} as Record<SourceType, ProducerKey>;

class MediasoupClientStore {
  root: RootStore;
  peerId?: string;
  peerName?: string;
  roomId?: string;
  isJoined: boolean = false;
  device: Device;

  sendTransport: Transport | null = null;
  recvTransport: Transport | null = null;

  videoProducer: AppProducer | null = null;
  audioProducer: AppProducer | null = null;
  screenProducer: AppProducer | null = null;

  remotePeers: ClientRemotePeer[] = [];

  remoteScreenConsumer: Consumer | null = null;
  remoteScreenStream: MediaStream | null = null;
  isRemoteScreenActive: boolean = false;

  constructor(root: RootStore) {
    this.root = root;
    this.device = new Device();

    makeAutoObservable(
      this,
      { remotePeers: observable.ref },
      { autoBind: true }
    );
  }

  private setLocalProducer(produer: AppProducer) {
    // TODO: навесить события на продюсер
    // producer.on('transportclose', ...) — транспорт умер → действуем (чистим состояние).
    // producer.on('trackended', ...) — исходный MediaStreamTrack закончился (пользователь «Stop sharing», камера пропала) → действуем (закрываем продюсер).
    // Observer:
    // producer.observer.on('close', ...) — продюсер уже закрыт → просто синхронизируем UI/стор.
    // producer.observer.on('pause', ...) — уже на паузе → обновляем индикаторы.
    // producer.observer.on('resume', ...) — уже возобновлён → обновляем индикаторы.
    // producer.observer.on('trackended', ...) — факт «трек закончился» (для логов).

    // TODO: при установке screen продюсера имеет смысл отключать камеру
    const kind: SourceType =
      produer.appData.source === "screen" ? "screen" : produer.kind;

    let existingProducer = this[producersMap[kind]];

    if (existingProducer) {
      (this[producersMap[kind]] as AppProducer).close();
      this[producersMap[kind]] = null;
    }

    this[producersMap[kind]] = produer;
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
    const { data } = await this.root.network.apiSend()<RtpCapabilities>(
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

    const { data } = await this.root.network.apiSend()<{
      transportParams: TransportOptions;
    }>("createSendTransport", this.defaultRoomData);

    this.sendTransport = this.device.createSendTransport(data.transportParams);

    this.sendTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        try {
          await this.root.network.apiSend()("connectSendTransport", {
            dtlsParameters,
            ...this.defaultRoomData,
          });
          callback();
        } catch (err) {
          if (err instanceof Error) {
            errback(err);
            this.root.error.setError(err);
          }
        }
      }
    );

    this.sendTransport.on(
      "produce",
      async ({ kind, rtpParameters, appData }, callback, errback) => {
        // appData передаем в sendTransport.produce()
        try {
          const { data } = await this.root.network.apiSend()<{ id: string }>(
            "produce",
            {
              kind,
              rtpParameters,
              appData,
              ...this.defaultRoomData,
            }
          );
          callback(data);
        } catch (error) {
          if (error instanceof Error) {
            errback(error);
            this.root.error.setError(error);
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
   * createProducer
   * Создает продюсер. Отправка медиа потока в комнату
   */
  private async createProducer(
    track: MediaStreamTrack,
    isScreenShare: boolean = false
  ) {
    if (!this.sendTransport) {
      throw new Error("sendTransport not found");
    }

    try {
      const producer = await this.sendTransport.produce({
        track,
        appData: { source: isScreenShare ? "screen" : (track.kind as Source) },
        ...(isScreenShare ? SCREEN_PRODUCER_OPTIONS : null),
      });

      this.setLocalProducer(producer);
    } catch (err) {
      if (err instanceof Error) {
        throw Error;
      }
    }
  }

  /**
   * consume
   * Создает консюмеры. Подписка на медиа потоки других участников(remotePeers)
   */
  private async consume(remotePeerIds: string[]) {
    const remoteProducersData = this.remotePeers
      .filter((p) => remotePeerIds.includes(p.id))
      .reduce<{ remotePeerId: string; producerId: string; source: Source }[]>(
        (acc, cur) => {
          const res = cur.producersData.map((val) => ({
            remotePeerId: cur.id,
            producerId: val.producerId,
            source: val.source,
          }));
          acc.push(...res);
          return acc;
        },
        []
      );

    const { roomId, peerId } = this.defaultRoomData;

    return Promise.all(
      remoteProducersData.map((p) =>
        this.createConsumer(
          roomId,
          peerId,
          p.remotePeerId,
          p.producerId,
          p.source === "screen"
        )
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
    const { data } = await this.root.network.apiSend()<{
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
    const { data } = await this.root.network.apiSend()<{
      transportParams: TransportOptions;
    }>("createRecvTransport", this.defaultRoomData);
    this.recvTransport = this.device.createRecvTransport(data.transportParams);

    /**
     * Срабатывает, когда впервые recvTransport.consume(),
     * в этот момент транспорту нужно установить DTLS-соединение с серверным WebRtcTransport.
     */
    this.recvTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        try {
          await this.root.network.apiSend()("connectRecvTransport", {
            dtlsParameters,
            ...this.defaultRoomData,
          });
          callback();
        } catch (error) {
          if (error instanceof Error) {
            errback(error);
            this.root.error.setError(error);
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
  private async addRemoteConsumer(remotePeerId: string, consumer: Consumer) {
    this.remotePeers = this.remotePeers.map((p) => {
      if (p.id !== remotePeerId) return p;

      const stream = p.mediaStream ?? new MediaStream();
      const track = consumer.track;

      // не добавляем повторно
      if (track && !stream.getTracks().includes(track)) {
        stream.addTrack(track);
      }
      // авточистка
      // const cleanup = () => this.removeRemoteConsumer(remotePeerId, consumer);
      // consumer.on("transportclose", cleanup);
      // consumer.on("producerclose", cleanup);
      // track?.addEventListener("ended", cleanup, { once: true });

      return {
        ...p,
        mediaStream: stream,
        consumers: [...p.consumers, consumer],
      };
    });
  }

  /**
   * createConsumer создает консюмер на backend и соответствующий на клиенте
   * запускается на каждом producerId
   */
  private async createConsumer(
    roomId: string,
    localPeerId: string,
    remotePeerId: string,
    producerId: string,
    isScreenShare: boolean = false
  ) {
    if (!this.recvTransport) {
      await this.createRecvTransport();
    }

    const { data } = await this.root.network.apiSend()<{
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

    if (!this.recvTransport) {
      throw new Error(`Create consumer: recvTransport not found`);
    }

    const consumer: Consumer<{ source: "screen" | "video" | "audio" }> =
      await this.recvTransport.consume({
        ...data,
        appData: {
          source: isScreenShare ? "screen" : data.kind,
          peerId: remotePeerId,
        },
      });

    if (isScreenShare) {
      this.addRemoteScreenConsumer(consumer);
      return;
    }

    this.addRemoteConsumer(remotePeerId, consumer);
  }

  /**
   * high-level method
   * createRoom
   * Создание новой комнаты
   */
  async createRoom(peerName: string) {
    try {
      await this.root.mediaDevices.init();
      await this.root.mediaDevices.startMediaTracks();
      // 1 создаем пуствую комнату
      const { data: dataRoom } = await this.root.network.apiSend()<{
        id: string;
        createAt: string;
      }>("createRoom");

      // 2 Запрос Rtp Capabilities
      const routerRtpCapabilities = await this.gerRouterRtpCapabilities(
        dataRoom.id
      );

      // Не гарантирует в будущем, что пир будет именно в этой комнате. Гарант того, что пир в комнате joinRoom
      const { data: dataPeer } = await this.root.network.apiSend()<Peer>(
        "createPeer",
        {
          roomId: dataRoom.id,
          name: peerName,
        }
      );

      // 4 загружаем Device
      const rtpCapabilities = await this.loadDevice(routerRtpCapabilities);

      // 5 Сервер добавит пира в комнату (isJoined = true), после чего можно подписываться и передавать Media
      const { peer } = await this.joinRoom(
        dataRoom.id,
        dataPeer.id,
        rtpCapabilities
      );
      runInAction(() => {
        this.peerId = peer.id;
        this.roomId = peer.roomId;
        this.peerName = peer.name;
        this.isJoined = peer.isJoined;
      });

      // Пустой массив
      this.remotePeers = [];
      await this.createSendTransport();

      const mediaTracks = this.root.mediaDevices.getMediaTracks();

      if (mediaTracks.length) {
        await Promise.all(
          mediaTracks.map((track) => this.createProducer(track))
        );
      }
    } catch (err) {
      this.cleanupSession();
      if (err instanceof Error) {
        this.root.error.setError(err);
      }
    }
  }

  /**
   * high-level method
   * enterRoom
   * Подключение к существующей комнате
   */
  async enterRoom(roomId: string, peerName: string) {
    try {
      await this.root.mediaDevices.startMediaTracks();
      // 1 Запрос Rtp Capabilities
      const routerRtpCapabilities = await this.gerRouterRtpCapabilities(roomId);
      // 2 создаем пира
      const { data: dataPeer } = await this.root.network.apiSend()<Peer>(
        "createPeer",
        {
          roomId: roomId,
          name: peerName,
        }
      );

      if (!dataPeer.id || !dataPeer.roomId || !dataPeer.name) {
        throw new Error("enterRoom failed!");
      }

      // 3 загружаем Device
      const rtpCapabilities = await this.loadDevice(routerRtpCapabilities);
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
        this.remotePeers = remotePeers.map((p) => ({
          ...p,
          consumers: [],
          mediaStream: new MediaStream(),
        }));
      });

      // 5 Создание recvtransport
      await this.createRecvTransport();
      // 6 Подписка на потоки
      await this.consume(this.remotePeers.map(({ id }) => id));
      // 7 отправка потоков
      await this.createSendTransport();
      const mediaTracks = this.root.mediaDevices.getMediaTracks();

      if (mediaTracks.length) {
        await Promise.all(
          mediaTracks.map((track) => this.createProducer(track))
        );
      }

      await this.root.network.apiSend()("peerConnected", this.defaultRoomData);
    } catch (err) {
      this.cleanupSession();
      if (err instanceof Error) {
        this.root.error.setError(err);
      }
    }
  }

  deleteRemotePeer(peerId: string) {
    const foundRemotePeer = this.remotePeers.find((p) => p.id === peerId);
    if (foundRemotePeer) {
      foundRemotePeer.consumers.forEach((c) => {
        c.close();
      });
    }
    this.remotePeers = this.remotePeers.filter((p) => p.id !== peerId);

    if (
      this.isRemoteScreenActive &&
      peerId === this.remoteScreenConsumer?.appData.peerId
    ) {
      this.clearRemoteScreen();
    }
  }

  async addRemotePeer(remotePeer: RemotePeer) {
    if (!this.recvTransport) {
      await this.createRecvTransport();
    }
    const clientRemotePeer = {
      ...remotePeer,
      consumers: [],
      mediaStream: new MediaStream(),
    };

    this.remotePeers = [...this.remotePeers, clientRemotePeer];
    await this.consume([clientRemotePeer.id]);
  }

  async endCall() {
    await this.root.network.apiSend()("endCall", this.defaultRoomData);
    this.cleanupSession();
  }

  camOf() {
    if (this.videoProducer) {
      this.videoProducer.close();
      this.videoProducer = null;
    }

    return this.root.network.apiSend()("camOf", this.defaultRoomData);
  }

  async camOn() {
    if (this.videoProducer) {
      this.videoProducer.close();
      this.videoProducer = null;
    }

    if (!this.sendTransport) {
      await this.createSendTransport();
    }

    const track = this.root.mediaDevices
      .getMediaTracks()
      .find((t) => t.kind === "video");

    if (!track) {
      throw new Error("camOn: video track not found");
    }

    await this.createProducer(track);
    await this.root.network.apiSend()("camOn", this.defaultRoomData);
  }

  /**
   * Удаленный абонент выключил продюсер, делаем отписку соответствующего консюмера
   */
  deleteConsumerFromRemotePeer(peerId: string, produserId: string) {
    this.remotePeers = this.remotePeers.map((p) => {
      if (p.id === peerId) {
        const foundConsumer = p.consumers.find(
          (c) => c.producerId === produserId
        );

        const track = foundConsumer?.track;

        if (track) {
          p.mediaStream.removeTrack(track);
        }

        foundConsumer?.close();
        p.consumers = p.consumers.filter((c) => c.producerId !== produserId);
        //p.producerIds = p.producerIds.filter((p) => p !== produserId);
        p.producersData = p.producersData.filter(
          (p) => p.producerId !== produserId
        );
        return { ...p };
      }
      return p;
    });
  }

  /**
   * Участник комнаты включил продюсер, делаем подписку
   */
  async addConsumerToRemotePeer(remotePeerId: string, producerId: string) {
    try {
      if (!this.roomId || !this.peerId) {
        throw new Error("addConsumerToRemotePeer error");
      }

      await this.createConsumer(
        this.roomId,
        this.peerId,
        remotePeerId,
        producerId
      );
    } catch (err) {
      console.log(err);
    }
  }

  async startLocalScreenShare(track: MediaStreamTrack) {
    if (!track) {
      return;
    }
    if (!this.sendTransport) {
      await this.createSendTransport();
    }
    await this.createProducer(track, true);
    await this.root.network.apiSend()("screenOn", this.defaultRoomData);
  }

  async stopLocalScreenShare() {
    this.screenProducer?.close();
    this.root.network.apiSend()("screenOf", this.defaultRoomData);
  }

  async startRemoteScreenShare(remotePeerId: string, screenProducerId: string) {
    if (!this.roomId || !this.peerId) {
      throw new Error("addConsumerToRemotePeer error");
    }
    await this.createConsumer(
      this.roomId,
      this.peerId,
      remotePeerId,
      screenProducerId,
      true
    );
  }

  async stopRemoteScreenShare(remotePeerId: string, screenProducerId: string) {
    if (!this.roomId || !this.peerId) {
      throw new Error("stopRemoteScreenShare error");
    }

    this.deleteConsumerFromRemotePeer(remotePeerId, screenProducerId);
    this.clearRemoteScreen();
  }

  clearRemoteScreen() {
    safeStop(...(this.remoteScreenStream?.getTracks() ?? []));
    safeClose(this.remoteScreenConsumer);

    runInAction(() => {
      this.remoteScreenStream = null;
      this.remoteScreenConsumer = null;
      this.isRemoteScreenActive = false;
    });
  }

  addRemoteScreenConsumer(consumer: Consumer) {
    if (this.remoteScreenConsumer || this.remoteScreenStream) {
      this.clearRemoteScreen();
    }
    const track = consumer.track;
    const screenStream = new MediaStream();
    screenStream.addTrack(track);
    this.remoteScreenStream = screenStream;
    this.remoteScreenConsumer = consumer;
    this.isRemoteScreenActive = true;
  }

  cleanupSession() {
    this.isJoined = false;
    this.peerId = undefined;
    this.peerName = undefined;
    this.roomId = undefined;
    this.remotePeers = [];

    safeClose(
      this.audioProducer,
      this.videoProducer,
      this.recvTransport,
      this.sendTransport,
      ...this.remotePeers.flatMap((remotePeer) => remotePeer.consumers)
    );

    this.clearRemoteScreen();
    this.root.mediaDevices.cleanupSession();
  }
}
export default MediasoupClientStore;
