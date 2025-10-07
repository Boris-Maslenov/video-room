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
import { KindType } from "../api/api.types";

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

export type ProducerKey = "audioProducer" | "videoProducer";

const printError = (err: unknown) => {
  console.error(err);
};

export type NetworkPeerStatus = "offline" | "connecting" | "online";

export type RemotePeer = {
  id: string;
  roomId: string;
  name: string;
  producerIds: string[];
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
} as Record<KindType, ProducerKey>;

class MediasoupClientStore {
  root: RootStore;
  peerId?: string;
  peerName?: string;
  roomId?: string;
  isJoined: boolean = false;
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

    makeAutoObservable(
      this,
      { remotePeers: observable.ref },
      { autoBind: true }
    );
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
          const { data } = await this.root.network.apiSend()<{ id: string }>(
            "produce",
            {
              kind,
              rtpParameters,
              ...this.defaultRoomData,
            }
          );
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
  private async consume(remotePeerIds: string[]) {
    const remoteProducersData = this.remotePeers
      .filter((p) => remotePeerIds.includes(p.id))
      .reduce<{ remotePeerId: string; producerId: string }[]>((acc, cur) => {
        const res = cur.producerIds.map((val) => ({
          remotePeerId: cur.id,
          producerId: val,
        }));

        acc.push(...res);
        return acc;
      }, []);

    const { roomId, peerId } = this.defaultRoomData;
    console.log("remoteProducersData", remoteProducersData);

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
          console.log("recvTransport connect");
          await this.root.network.apiSend()("connectRecvTransport", {
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
    producerId: string
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
        await Promise.all(mediaTracks.map((track) => this.produce(track)));
      }
      console.log("createRoom: final");
    } catch (err) {
      console.log("createRoom catch");
      this.cleanupSession();
      printError(err);
    }
  }

  /**
   * high-level method
   * enterRoom
   * Подключение к существующей комнате
   */
  async enterRoom(roomId: string, peerName: string) {
    console.log("enterRoom", "roomId: ", roomId, "peerName: ", peerName);
    try {
      await this.root.mediaDevices.init();
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
        await Promise.all(mediaTracks.map((track) => this.produce(track)));
      }
      await this.root.network.apiSend()("peerConnected", this.defaultRoomData);
      console.log("enterRoom final");
    } catch (err) {
      console.log("enter room catch");
      this.cleanupSession();
      printError(err);
    }
  }

  deleteRemotePeer(peerId: string) {
    console.log("removeRemotePeer: ", peerId, this);
    const foundRemotePeer = this.remotePeers.find((p) => p.id === peerId);

    if (foundRemotePeer) {
      foundRemotePeer.consumers.forEach((c) => {
        c.close();
      });
    }

    this.remotePeers = this.remotePeers.filter((p) => p.id !== peerId);
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

    console.log("remotePeers после консюма", this.remotePeers);
  }

  async endCall() {
    console.log("endCall");
    await this.root.network.apiSend()("endCall", this.defaultRoomData);
    this.cleanupSession();
  }

  cleanupSession() {
    this.isJoined = false;
    this.peerId = undefined;
    this.peerName = undefined;
    this.roomId = undefined;
    this.root.mediaDevices.stopAllTracks(this.root.mediaDevices.stream);
    this.audioProducer?.close();
    this.videoProducer?.close();
    this.remotePeers
      .flatMap((remotePeer) => remotePeer.consumers)
      .forEach((c) => c.close());
    this.remotePeers = [];
    this.recvTransport?.close();
    this.sendTransport?.close();
  }
}
export default MediasoupClientStore;
