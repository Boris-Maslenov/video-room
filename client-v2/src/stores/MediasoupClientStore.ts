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
import {
  ACTIVE_SPEAKER_UPDATE_INTERVAL_MS,
  SCREEN_PRODUCER_OPTIONS,
} from "../config";

export type MediaDevice = {
  deviceId: string;
  label: string;
  groupId: string;
};

export type ProducerKey = "audioProducer" | "videoProducer" | "screenProducer";

export type NetworkPeerStatus = "offline" | "connecting" | "online";

export type NetworkQuality = "good" | "medium" | "bad" | "very-bad";

export type QualityData = Partial<Record<"video" | "audio" | "screen", number>>;

export type Source = "audio" | "video" | "screen";

export type RemoteProducerData = {
  producerId: string;
  source: Source;
};

export type AppProducer = Producer<{ source: Source }>;

export type Peer = {
  id: string;
  roomId: string;
  name: string;
  socketId: string;
  isJoined: boolean;
  networkQuality?: QualityData;
};

export type RemotePeer = Peer & {
  micOn: boolean;
  camOn: boolean;
  producersData: RemoteProducerData[];
};

export type ClientRemotePeer = RemotePeer & {
  consumers: Consumer<{ peerId: string; source: Source }>[];
  mediaStream: MediaStream;
  isSelf?: boolean;
};

export type ViewShema = Record<number, ClientRemotePeer[]>;

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

  private _selfPeer: ClientRemotePeer | null = null;
  private _activeSpeakers: Set<string> = new Set();
  private _idTimeOut: number | null = null;
  private _networkQuality: QualityData | null = null;

  constructor(root: RootStore) {
    this.root = root;
    this.device = new Device();

    makeAutoObservable(
      this,
      { remotePeers: observable.ref },
      { autoBind: true }
    );
  }

  get getActiveSpeakers() {
    return Array.from(this._activeSpeakers);
  }

  setActiveSpeakers(ids: string[]) {
    if (this._idTimeOut) {
      window.clearTimeout(this._idTimeOut);
      this._idTimeOut = null;
    }

    this._activeSpeakers = new Set(ids);

    this._idTimeOut = window.setTimeout(
      () => this.clearActiveSpeaker(),
      ACTIVE_SPEAKER_UPDATE_INTERVAL_MS
    );
  }

  clearActiveSpeaker() {
    this._activeSpeakers.clear();
  }

  get networkQuality() {
    return this._networkQuality;
  }

  set networkQuality(q: QualityData | null) {
    this._networkQuality = q;
  }

  get selfPeer() {
    return this._selfPeer;
  }

  set selfPeer(peer: ClientRemotePeer | null) {
    this._selfPeer = peer;
  }

  createSelfPeer(id: string, roomId: string, name: string, isJoined: boolean) {
    const activeProducers = [
      this?.audioProducer,
      this?.videoProducer,
      this?.screenProducer,
    ].filter(Boolean) as Producer<{
      source: Source;
    }>[];

    const videoTrack = this.root.mediaDevices.videoTrack;

    this.selfPeer = {
      id,
      roomId,
      name,
      micOn: this.root.mediaDevices.micOn,
      camOn: this.root.mediaDevices.camOn,
      producersData: activeProducers.map((p) => ({
        producerId: p.id,
        source: p.appData.source,
      })),
      socketId: "",
      isJoined,
      consumers: [],
      mediaStream: new MediaStream(videoTrack ? [videoTrack] : []),
      isSelf: true,
    };
  }

  updateSelfPeer(data: Partial<ClientRemotePeer>) {
    if (!this._selfPeer) {
      return;
    }
    this._selfPeer = { ...this._selfPeer, ...data };
  }

  manageViewConsumers(activeGroupId: number) {
    const ids = this.root.viewPeer.getViewShema[activeGroupId].map((p) => p.id);

    const pretendentsForOn = this.remotePeers.filter((p) => ids.includes(p.id));
    const pretendentsForOf = this.remotePeers.filter(
      (p) => !ids.includes(p.id)
    );

    // консюмеры которые были запущены
    const updatedForOn = [] as string[];
    // консюмеры которые были остановлены
    const updatedForOf = [] as string[];
    // пиры которые нужно обновить
    const updatedIds = [] as string[];

    pretendentsForOn.forEach((peer) => {
      const foundVideoConsumer = peer.consumers.find((c) => c.kind === "video");
      // Запускаем все которые в области просмотра
      if (foundVideoConsumer) {
        foundVideoConsumer.resume();
        updatedForOn.push(foundVideoConsumer.id);
        updatedIds.push(peer.id);
      }
    });

    pretendentsForOf.forEach((peer) => {
      const foundVideoConsumer = peer.consumers.find((c) => c.kind === "video");
      // Останавливаем только активные консюмеры
      if (foundVideoConsumer && !foundVideoConsumer.paused) {
        foundVideoConsumer.pause();
        updatedForOf.push(foundVideoConsumer.id);
        updatedIds.push(peer.id);
      }
    });

    if (updatedIds.length > 0) {
      this.remotePeers = this.remotePeers.map((p) =>
        updatedIds.includes(p.id) ? { ...p } : p
      );
    }

    if (updatedForOn.length > 0) {
      this.root.network.apiSend("consumerResume", {
        ...this.defaultRoomData,
        consumerIds: updatedForOn,
      });
    }

    if (updatedForOf.length > 0) {
      this.root.network.apiSend("consumerPause", {
        ...this.defaultRoomData,
        consumerIds: updatedForOf,
      });
    }
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
    const { data } = await this.root.network.apiSend<RtpCapabilities>(
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

    const { data } = await this.root.network.apiSend<{
      transportParams: TransportOptions;
    }>("createSendTransport", this.defaultRoomData);

    this.sendTransport = this.device.createSendTransport(data.transportParams);

    this.sendTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        try {
          await this.root.network.apiSend("connectSendTransport", {
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
          const { data } = await this.root.network.apiSend<{ id: string }>(
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
   * Отправка медиа потока в комнату
   */
  private async send(track: MediaStreamTrack, isScreenShare: boolean = false) {
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
      throw err;
    }
  }

  /**
   * recv
   * Подписка на медиа потоки других участников
   */
  private async recv(remotePeerIds: string[]) {
    const visiblyPeerIds = this.root.viewPeer.getVisiblePeerIds();

    const remoteProducersData = this.remotePeers
      .filter((p) => remotePeerIds.includes(p.id))
      .reduce<
        {
          remotePeerId: string;
          producerId: string;
          source: Source;
          paused: boolean;
        }[]
      >((acc, cur) => {
        const res = cur.producersData.map((val) => ({
          remotePeerId: cur.id,
          producerId: val.producerId,
          source: val.source,
          // если пир не в зоне видимоти, то видео консюмер ставим на паузу
          paused: val.source === "video" && !visiblyPeerIds.includes(cur.id),
        }));
        acc.push(...res);
        return acc;
      }, []);

    const { roomId, peerId } = this.defaultRoomData;

    return Promise.all(
      remoteProducersData.map((p) =>
        this.createConsumer(
          roomId,
          peerId,
          p.remotePeerId,
          p.producerId,
          p.source === "screen",
          p.paused
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
    const { data } = await this.root.network.apiSend<{
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
    const { data } = await this.root.network.apiSend<{
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
          await this.root.network.apiSend("connectRecvTransport", {
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
      switch (state) {
        case "failed": {
          // если упал приемный транспорт, значит уже не сможем принимать потоки, показываем ошибку и выходим из комнаты
          this.root.error.setError(`recvTransport state: ${state}`);
          this.endCall();
          break;
        }
        case "disconnected": {
          this.root.error.setError(`recvTransport state: ${state}`);
          break;
        }
      }
    });
  }

  /**
   * addRemoteConsumer
   * Добавляет консюмер к пиру
   */
  private async addRemoteConsumer(
    remotePeerId: string,
    consumer: Consumer<{ source: Source; peerId: string }>
  ) {
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
    isScreenShare: boolean = false,
    paused: boolean = false
  ) {
    if (!this.device) {
      throw new Error("createConsumer error: device not found");
    }

    if (!this.recvTransport) {
      await this.createRecvTransport();
    }

    const { data } = await this.root.network.apiSend<{
      id: string;
      rtpParameters: RtpParameters;
      kind: KindType;
      producerId: string;
    }>("createConsumer", {
      rtpCapabilities: this.device.rtpCapabilities,
      producerId,
      roomId,
      peerId: localPeerId, // peer потребитель
      paused,
      exporterId: remotePeerId, // peer поставщик
    });

    if (!this.recvTransport) {
      throw new Error(`Create consumer: recvTransport not found`);
    }

    const consumer: Consumer<{
      source: "screen" | "video" | "audio";
      peerId: string;
    }> = await this.recvTransport.consume({
      ...data,
      appData: {
        source: isScreenShare ? "screen" : data.kind,
        peerId: remotePeerId,
      },
    });

    // Для синхронизации состояния вручную ставим клиентский консюмер на паузу
    if (paused) {
      consumer.pause();
    }

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
      await this.root.mediaDevices.initV2();
      // 1 создаем пуствую комнату
      const { data: dataRoom } = await this.root.network.apiSend<{
        id: string;
        createAt: string;
      }>("createRoom");

      // 2 Запрос Rtp Capabilities
      const routerRtpCapabilities = await this.gerRouterRtpCapabilities(
        dataRoom.id
      );

      // Не гарантирует в будущем, что пир будет именно в этой комнате. Гарант того, что пир в комнате joinRoom
      const { data: dataPeer } = await this.root.network.apiSend<Peer>(
        "createPeer",
        {
          roomId: dataRoom.id,
          name: peerName,
          camOn: this.root.mediaDevices.camOn,
          micOn: this.root.mediaDevices.micOn,
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
        this.createSelfPeer(peer.id, peer.roomId, peer.name, peer.isJoined);
      });

      console.log("this.joinRoom", peer);

      // Пустой массив
      this.remotePeers = [];
      await this.createSendTransport();

      const mediaTracks = this.root.mediaDevices.getMediaTracks();

      if (mediaTracks.length) {
        await Promise.all(mediaTracks.map((track) => this.send(track)));
      }
    } catch (err) {
      this.cleanupMediaSession();
      this.root.mediaDevices.cleanupDevicesSession();
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
    console.log("enterRoom", roomId, peerName);
    try {
      // await this.root.mediaDevices.startMediaTracks();
      // 1 Запрос Rtp Capabilities
      const routerRtpCapabilities = await this.gerRouterRtpCapabilities(roomId);
      console.log("enterRoom 1", routerRtpCapabilities);
      // 2 создаем пира
      const { data: dataPeer } = await this.root.network.apiSend<Peer>(
        "createPeer",
        {
          roomId: roomId,
          name: peerName,
          camOn: this.root.mediaDevices.camOn,
          micOn: this.root.mediaDevices.micOn,
        }
      );

      console.log("enterRoom 2", dataPeer);

      if (!dataPeer.id || !dataPeer.roomId || !dataPeer.name) {
        throw new Error("enterRoom failed!");
      }

      // 3 загружаем Device
      const rtpCapabilities = await this.loadDevice(routerRtpCapabilities);
      console.log("enterRoom 3", rtpCapabilities);
      // 4 Сервер успешно добавил пира и вернул участников комнаты
      const { remotePeers, peer } = await this.joinRoom(
        roomId,
        dataPeer.id,
        rtpCapabilities
      );
      console.log("enterRoom 4", remotePeers, peer);

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
        this.createSelfPeer(peer.id, peer.roomId, peer.name, peer.isJoined);
      });

      // 5 Создание recvtransport
      await this.createRecvTransport();
      console.log("enterRoom 5");
      // 6 Подписка на потоки
      await this.recv(this.remotePeers.map(({ id }) => id));
      console.log("enterRoom 6");
      // 7 отправка потоков
      await this.createSendTransport();
      console.log("enterRoom 7", this.device);
      const mediaTracks = this.root.mediaDevices.getMediaTracks();

      if (mediaTracks.length) {
        await Promise.all(mediaTracks.map((track) => this.send(track)));
      }
      console.log("enterRoom 8");

      await this.root.network.apiSend("peerConnected", this.defaultRoomData);
      console.log("enterRoom 9");
    } catch (err) {
      this.cleanupMediaSession();
      this.root.mediaDevices.cleanupDevicesSession();
      if (err instanceof Error) {
        this.root.error.setError("Ошибка подключения к комнате: " + err);
      }
    }
  }

  /**
   * Удаляет пира из комнаты
   */
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

  /**
   * Добавляет нового пира в комнату
   */
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
    await this.recv([clientRemotePeer.id]);

    console.log(this.remotePeers);
  }

  camOff() {
    if (this.videoProducer) {
      this.videoProducer.close();
      this.videoProducer = null;
    }

    if (this.selfPeer) {
      this.selfPeer = {
        ...this.selfPeer,
        mediaStream: new MediaStream(),
        camOn: false,
      };
    }
    return this.root.network.apiSend("camOff", this.defaultRoomData);
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

    if (this.selfPeer && track) {
      this.selfPeer.mediaStream.getTracks().forEach((t) => {
        t.stop;
        this.selfPeer!.mediaStream.removeTrack(t);
      });
      this.selfPeer = {
        ...this.selfPeer,
        mediaStream: new MediaStream([track]),
        camOn: true,
      };
    }

    await this.send(track);
    await this.root.network.apiSend("camOn", this.defaultRoomData);
  }

  /**
   * Удаленный абонент выключил продюсер, делаем отписку соответствующего консюмера
   */
  deleteConsumerFromRemotePeer(peerId: string, produserId: string) {
    console.log("deleteConsumerFromRemotePeer", peerId, produserId);
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

      const visibilityPeerIds = this.root.viewPeer.getVisiblePeerIds();

      await this.createConsumer(
        this.roomId,
        this.peerId,
        remotePeerId,
        producerId,
        false,
        !visibilityPeerIds.includes(remotePeerId)
      );
    } catch (err) {
      console.log(err);
    }
  }

  toggleMic(micOn: boolean) {
    if (!this.isJoined) return;

    runInAction(() => {
      if (this.selfPeer) {
        this.selfPeer = { ...this.selfPeer, micOn };
      }
    });

    this.root.network.apiSend("toggleMic", {
      ...this.defaultRoomData,
      micOn,
    });
  }

  toggleRemoteMic(peerId: string, micOn: boolean) {
    this.remotePeers = this.remotePeers.map((p) =>
      p.id === peerId ? { ...p, micOn } : p
    );
  }

  updateRemoteNetworkQuality(peerId: string, networkQuality: QualityData) {
    if (peerId === this.selfPeer?.id) {
      this.networkQuality = networkQuality;
      return;
    }
    // todo: не обновлять компонент если качество не поменялось

    this.remotePeers = this.remotePeers.map((p) =>
      p.id === peerId ? { ...p, networkQuality } : p
    );
  }

  async startLocalScreenShare(track: MediaStreamTrack) {
    if (!track) {
      return;
    }
    if (!this.sendTransport) {
      await this.createSendTransport();
    }
    await this.send(track, true);
    await this.root.network.apiSend("screenOn", this.defaultRoomData);
  }

  async stopLocalScreenShare() {
    this.screenProducer?.close();
    this.screenProducer = null;
    this.root.network.apiSend("screenOff", this.defaultRoomData);
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

  async endCall() {
    await this.root.network.apiSend("endCall", this.defaultRoomData);
    this.root.mediaDevices.cleanupDevicesSession();
    this.cleanupMediaSession();
  }

  cleanupMediaSession() {
    this.isJoined = false;
    this.peerId = undefined;
    this.peerName = undefined;
    this.roomId = undefined;
    this.remotePeers = [];

    this.selfPeer?.mediaStream.getTracks().forEach((t) => t.stop());
    this.selfPeer = null;

    safeClose(
      this.audioProducer,
      this.videoProducer,
      this.recvTransport,
      this.sendTransport,
      ...this.remotePeers.flatMap((remotePeer) => remotePeer.consumers)
    );

    this.audioProducer = null;
    this.videoProducer = null;
    this.recvTransport = null;
    this.sendTransport = null;

    this.clearRemoteScreen();
  }
}
export default MediasoupClientStore;
