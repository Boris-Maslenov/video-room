import { Device } from "mediasoup-client";
import {
  RtpCapabilities,
  Transport,
  TransportOptions,
  ConsumerOptions,
  Consumer,
  Producer,
} from "mediasoup-client/lib/types";
import { KindType } from "./types";
import { apiSend as socketSend } from "../api/api";

type ProduserDataType = {
  roomId: string;
  peerId: string;
  peerName: string;
  id: string;
  kind: KindType;
};

type RoomDataType = {
  peerName: string;
  peerId: string;
  ioId: string;
  roomId: string;
};

class RoomClient {
  roomData?: RoomDataType;
  device?: Device;
  sendTransport?: Transport;
  recvTransport?: Transport;
  videoProducer?: Producer;
  audioProducer?: Producer;
  activeProducersData?: ProduserDataType[];
  activeConsumers?: Consumer[];

  constructor() {
    this.roomData;
    this.device;
    this.sendTransport;
    this.recvTransport;
    this.videoProducer;
    this.audioProducer;
    this.activeProducersData = [];
    this.activeConsumers = [];
  }

  /**
   * Запросить список активных продюсеров (включая свой собственный) в пределах 1 комнаты
   */
  private async getProducers(roomId: string, peerId: string) {
    return await socketSend<ProduserDataType[]>("getProducers", {
      roomId,
      peerId,
    });
  }

  /**
   * Запрос RTP возможностей у роутера
   */
  async gerRouterRtpCapabilites() {
    return await socketSend<RtpCapabilities>("getRouterRtpCapabilities");
  }

  /**
   * Инициализация Device
   * Позволяет определять, какие медиа он может отправлять (SendTransport) или принимать (RecvTransport).
   */
  async loadDevice() {
    if (this.device) return;

    this.device = new Device();
    const routerRtpCapabilities = await this.gerRouterRtpCapabilites();
    try {
      await this.device.load({ routerRtpCapabilities });
    } catch (e) {
      console.log(e);
    }
  }

  /**
   * Создание Producer Transport
   */
  async createProducerTransport(roomId: string, peerId: string) {
    if (!this.device) return;

    const params = await socketSend<TransportOptions>(
      "createProducerTransport",
      { appData: { roomId, peerId } }
    );

    this.sendTransport = await this.device.createSendTransport(params);

    this.connectProducerTransport(roomId, peerId);
  }

  /**
   * Подключение Producer Transport
   */
  connectProducerTransport(roomId: string, peerId: string) {
    if (!this.sendTransport) return;

    this.sendTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, _errback) => {
        console.log("sendTransport connect");
        await socketSend("connectProducerTransport", {
          dtlsParameters,
          appData: {
            roomId,
            peerId,
          },
        });
        callback();
      }
    );

    this.sendTransport.on(
      "produce",
      async ({ kind, rtpParameters, appData }, callback, _errback) => {
        console.log("sendTransport produce", kind);
        // appData передаем в sendTransport.produce()
        const data = await socketSend<{ id: string }>("createProducer", {
          kind,
          rtpParameters,
          appData,
        });
        callback(data);
      }
    );
  }

  /**
   * Получить медиа Трэки
   */
  async getMediaTracks() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    const tracks = {
      videoTrack: stream.getVideoTracks()[0],
      audioTrack: stream.getAudioTracks()[0],
    };

    console.log("stream.getAudioTracks()", stream.getAudioTracks());

    return tracks;
  }

  /**
   * create Consumer Transport
   */
  async createRecvTransport(roomId: string, peerId: string) {
    if (!this.device) return;

    const transportOptions = await socketSend<TransportOptions>(
      "createConsumerTransport",
      { appData: { roomId, peerId } }
    );
    this.recvTransport = await this.device.createRecvTransport(
      transportOptions
    );
  }

  /**
   * Подключение RecvTransport
   */
  async connectRecvTransport(
    roomId: string,
    peerId: string
  ): Promise<string | undefined> {
    console.log("connectRecvTransport", this.recvTransport);
    if (!this.recvTransport) return;
    // Событие автоматически генерируется mediasoup-client, когда требуется передать DTLS параметры на сервер.
    this.recvTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        console.log("this.recvTransport.on : connect");
        try {
          await socketSend("connectConsumerTransport", {
            transportId: this.recvTransport!.id,
            dtlsParameters,
            appData: { roomId, peerId },
          });
          // сервер подтвердил соединение
          callback();
        } catch (error) {
          if (error instanceof Error) {
            errback(error);
          }
        }
      }
    );

    return await new Promise((res, rej) => {
      if (!this.recvTransport) {
        rej("recvTransport не готов");
        return;
      }

      this.recvTransport.on("connectionstatechange", async (state) => {
        console.log('this.recvTransport.on("connectionstatechange"))', state);
        if (state === "connected") {
          // Генерируется после recvTransport.consume
          // Можно воспроизводить медиапотоки.
          console.log(
            "recvTransport: connected Можно воспроизводить медиапотоки."
          );

          res("connected");
        }
      });
    });
  }

  /**
   * Создает Consumers
   */
  async createConsumer(producerData: ProduserDataType) {
    console.log("createConsumer start...");
    if (!this.device || !this.recvTransport) return;
    const { roomId } = producerData;
    const { rtpCapabilities } = this.device;

    try {
      const response = await socketSend<ConsumerOptions>("createConsumer", {
        rtpCapabilities,
        appData: {
          roomId,
          peerId: this.roomData?.peerId,
          producerId: producerData.id,
          mediaTag: producerData.kind,
        },
      });

      const { id, rtpParameters, kind, producerId } = response;
      console.log("response", producerId);

      if (kind === "audio") {
        const audioConsumer = await this.recvTransport!.consume({
          id,
          rtpParameters,
          producerId,
          kind,
        });

        this.activeConsumers?.push(audioConsumer);
      }

      if (kind === "video") {
        const videoConsumer = await this.recvTransport!.consume({
          id,
          rtpParameters,
          producerId,
          kind,
        });

        this.activeConsumers?.push(videoConsumer);
      }
      console.log("createConsumer end");
    } catch (error) {
      console.log("Oшибка создания Consumer-а", error);
    }
  }

  /**
   * Отправка Медиа потока в комнату
   */
  async produce(roomId: string, peerId: string): Promise<boolean> {
    if (!this.device) {
      await this.loadDevice();
    }

    await this.createProducerTransport(roomId, peerId);

    if (!this.sendTransport) {
      return false;
    }

    try {
      const { audioTrack, videoTrack } = await this.getMediaTracks();

      this.audioProducer = await this.sendTransport.produce({
        track: audioTrack.clone(),
        appData: {
          mediaTag: "audio",
          peerId,
          roomId,
        },
      });

      this.videoProducer = await this.sendTransport.produce({
        track: videoTrack.clone(),
        appData: {
          mediaTag: "video",
          peerId,
          roomId,
        },
      });
    } catch (e) {
      console.log("catch", e);
    }

    return await new Promise((res) => {
      this.sendTransport!.on("connectionstatechange", (state) => {
        if (state === "connected") {
          console.log("sendTransport state === connected");
          res(true);
        }
      });
    });
  }

  /**
   * Подписка на события продюсера
   */
  async subscribeEventsProducer(producer: Producer) {
    if (!producer) return;
    producer.on("trackended", () => {
      console.log("Track ended, stopping producer.");
    });

    producer.on("transportclose", () => {
      console.log("Transport was closed, producer will be destroyed.");
    });
  }

  /**
   * Прием медиа потока (подписка на все продюсеры, кроме своего)
   */
  async subscribe(roomId: string, peerId: string) {
    if (!this.device) {
      await this.loadDevice();
    }

    await this.createRecvTransport(roomId, peerId);
    this.activeProducersData = await this.getProducers(roomId, peerId);

    for (const producerData of this.activeProducersData) {
      if (producerData.peerId !== this.roomData?.peerId) {
        this.createConsumer(producerData);
      }
    }

    await this.connectRecvTransport(roomId, peerId);
    return roomId;
  }

  async connectToRoom(peerName = "testPeer 2", roomId = "0") {
    try {
      const roomData = await socketSend<RoomDataType>("connectRoom", {
        peerName,
        roomId,
      });

      this.roomData = roomData;
      if (!this.roomData) return;
      await this.subscribe(this.roomData.roomId, this.roomData.peerId);
      return this.roomData.roomId;
    } catch (e) {
      console.log(e);
    }
  }

  private async createNewRoom(
    peerName: string
  ): Promise<RoomDataType | undefined> {
    try {
      const response = await socketSend<RoomDataType>("createRoom", {
        peerName,
      });
      this.roomData = response;
    } catch (e) {
      console.log(e);
    }

    return this.roomData;
  }

  async createAndConnectRoom(peerName = "testPeer 1") {
    const roomdata = await this.createNewRoom(peerName);
    if (roomdata?.roomId && roomdata?.peerId) {
      console.log("produce start");
      await this.produce(roomdata.roomId, roomdata.peerId);
      console.log("produce end");
      // await this.subscribe(roomdata.roomId, roomdata.peerId);
      return roomdata?.roomId;
    }
  }
}

export default RoomClient;

// const combinedStream = new MediaStream();
// combinedStream.addTrack(this.videoConsumer!.track);
// combinedStream.addTrack(this.audioConsumer!.track);
// const el = document.querySelector("#video2") as HTMLVideoElement;
// el.srcObject = combinedStream;
