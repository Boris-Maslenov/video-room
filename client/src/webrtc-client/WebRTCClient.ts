import { Device } from "mediasoup-client";
import { io, type Socket } from "socket.io-client";
import {
  RtpCapabilities,
  Transport,
  TransportOptions,
  ConsumerOptions,
  Consumer,
  Producer,
} from "mediasoup-client/lib/types";

import { SocketSendType } from "./model";
// const socket = io("ws://localhost:3001");
const socket = io("ws://192.168.0.104:3001");

function socketPromise<T>(socket: Socket) {
  return (type: string, data = {}): Promise<T> =>
    new Promise((resolve) => {
      socket.emit(type, data, resolve);
    });
}

const socketSend: SocketSendType = socketPromise(socket);

type ProducerInfo = {
  producerId: string;
  kind: "audio" | "video";
};

class WebRTCClient {
  device?: Device;
  sendTransport?: Transport;
  recvTransport?: Transport;
  consumer?: Consumer;
  audioConsumer?: Consumer;
  producer?: Producer;
  audioProducer?: Producer;
  serverProducers?: ProducerInfo[];

  constructor() {
    this.device;
    this.sendTransport;
    this.recvTransport;
    this.consumer;
    this.audioConsumer;
    this.producer;
    this.audioProducer;
    this.serverProducers = [];
  }

  /**
   * Запросить список доступных продюсеров на сервере
   */
  async getProducers() {
    return await socketSend<ProducerInfo[]>("getProducers");
  }

  /**
   * Запрос RTP возможностей у роутера
   */
  async gerRouterRtpCapabilites() {
    return await socketSend<RtpCapabilities>("getRouterRtpCapabilities");
  }

  /**
   * Инициализация Device
   * Позволяет клиенту понять, какие медиа он может отправлять (SendTransport) или принимать (RecvTransport).
   */
  async loadDevice() {
    if (this.device) return;

    this.device = new Device();
    const routerRtpCapabilities = await this.gerRouterRtpCapabilites();
    await this.device.load({ routerRtpCapabilities });
  }

  /**
   * Создание транспорта для отправки данных
   */
  async createSendTransport() {
    if (!this.device) return;
    const params = await socketSend<TransportOptions>(
      "createProducerTransport"
    );
    this.sendTransport = this.device.createSendTransport(params);
  }

  /**
   * Подписка на события producer Transport
   */
  subscribeProducerTransport() {
    if (!this.sendTransport) return;

    const transport = this.sendTransport;
    transport.on("connect", async ({ dtlsParameters }, callback, _errback) => {
      await socketSend("connectProducerTransport", {
        dtlsParameters,
        // transportId: transport.id
      });
      callback();
    });

    transport.on(
      "produce",
      async ({ kind, rtpParameters, appData }, callback, _errback) => {
        // appData передаем в sendTransport.produce()
        const data = await socketSend<{ id: string }>("createProducer", {
          kind,
          rtpParameters,
          appData,
        });
        callback(data);
      }
    );

    transport.on("connectionstatechange", (state) => {
      console.log("connectProducerTransport:", state);
    });
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

    return tracks;
  }

  /**
   * create Consumer Transport
   */
  async createRecvTransport() {
    if (!this.device) return;

    const transportOptions = await socketSend<TransportOptions>(
      "createConsumerTransport"
    );
    this.recvTransport = this.device.createRecvTransport(transportOptions);
  }

  /**
   * Подписка на события transport
   */
  async subscribeConsumerTransport() {
    if (!this.recvTransport) return;

    this.recvTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        try {
          await socketSend("connectConsumerTransport", {
            transportId: this.recvTransport!.id,
            dtlsParameters,
          });
          callback();
        } catch (error) {
          if (error instanceof Error) {
            errback(error);
          }
        }
      }
    );

    this.recvTransport.on("connectionstatechange", async (state) => {
      if (state === "connected") {
        const combinedStream = new MediaStream();
        combinedStream.addTrack(this.consumer!.track);
        combinedStream.addTrack(this.audioConsumer!.track);
        const el = document.querySelector("#video2") as HTMLVideoElement;
        el.srcObject = combinedStream;
      }
    });
  }

  /**
   * Создание Consumer
   */
  async createConsumer(produserInfo: ProducerInfo) {
    if (!this.device || !this.recvTransport) return;

    const { rtpCapabilities } = this.device;
    const response = await socketSend<ConsumerOptions & { error?: string }>(
      "createConsumer",
      {
        rtpCapabilities,
        appData: {
          mediaTag: produserInfo.kind,
          producerId: produserInfo.producerId,
        },
      }
    );

    if (response?.error) {
      throw new Error(response?.error);
    }

    const { producerId, id, kind, rtpParameters } = response;

    if (produserInfo.kind === "video") {
      this.consumer = await this.recvTransport.consume({
        id,
        rtpParameters,
        ...produserInfo,
      });
    }
    if (produserInfo.kind === "audio") {
      this.audioConsumer = await this.recvTransport.consume({
        id,
        rtpParameters,
        ...produserInfo,
      });
    }

    // можно поток добавлять тут
  }

  /**
   * Создание нескольких консюмеров
   */
  async createConsumers() {
    const producersInfo = await this.getProducers();
    if (!producersInfo.length) return;

    for (const info of producersInfo) {
      await this.createConsumer(info);
    }
  }

  /**
   * Отправка Медиа потока
   */
  async send() {
    if (!this.device) {
      await this.loadDevice();
    }

    await this.createSendTransport();
    this.subscribeProducerTransport();

    try {
      const { videoTrack, audioTrack } = await this.getMediaTracks();

      this.producer = await this.sendTransport!.produce({
        track: videoTrack,
        appData: { mediaTag: "camera" },
      });

      this.audioProducer = await this.sendTransport!.produce({
        track: audioTrack,
        appData: { mediaTag: "mic" },
      });

      // this.subscribeEventsProducer(this.producer);
    } catch (e) {
      console.log("catch", e);
    }
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
   * Прием медиа потока
   */
  async subscribe() {
    // const producersInfo = await this.getProducers();

    if (!this.device) {
      await this.loadDevice();
    }
    await this.createRecvTransport();
    this.subscribeConsumerTransport();
    await this.createConsumers();

    console.log("this.consumer", this.consumer);
    console.log("this.audioconsumer", this.audioConsumer);
  }

  async getVideo() {
    const el = document.querySelector("#video") as HTMLVideoElement;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    el.srcObject = stream;
  }
}

export default WebRTCClient;

// for (const pInfo of producers) {
//   if (pInfo.kind === "video") {
//     this.consumer = await this.recvTransport.consume({
//       id,
//       rtpParameters,
//       ...pInfo,
//     });
//   }
//   if (pInfo.kind === "audio") {
//     this.audioConsumer = await this.recvTransport.consume({
//       id,
//       rtpParameters,
//       ...pInfo,
//     });
//   }
// }
