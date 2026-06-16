import { Router } from "mediasoup/node/lib/RouterTypes";
import { Transport } from "mediasoup/node/lib/TransportTypes";
import {
  IceParameters,
  IceCandidate,
  DtlsParameters,
} from "mediasoup/node/lib/WebRtcTransportTypes";
import { SctpParameters } from "mediasoup/node/lib/sctpParametersTypes";

export type TransportParams = {
  id: string;
  iceParameters: IceParameters;
  iceCandidates: IceCandidate[];
  dtlsParameters: DtlsParameters;
  sctpParameters?: SctpParameters;
};

import { PUBLIC_IP } from "../config";

const ips = [
  {
    ip: "0.0.0.0",
    announcedIp: PUBLIC_IP,
  },
];

export async function createWebRtcTransport(
  router: Router,
): Promise<{ transportParams: TransportParams; transport: Transport }> {
  const transport = await router.createWebRtcTransport({
    listenIps: ips,
    enableUdp: true,
    enableTcp: false,
    // preferUdp: true,
  });

  const transportParams = {
    id: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters,
  };

  return { transport, transportParams };
}

// todo: переделать архитектуру под новый стиль
// главное преимущество, что в такой схеме множество транспортов обрабатываются через 1 порт, который мониторит сервер. 1 сервер на роутер(комнату)

// const webRtcServer = await worker.createWebRtcServer({
//   listenInfos: [
//     {
//       protocol: "udp",
//       ip: "0.0.0.0",
//       announcedAddress: PUBLIC_IP,
//       portRange: { min: 40000, max: 40100 },
//     },
//     {
//       protocol: "tcp",
//       ip: "0.0.0.0",
//       announcedAddress: PUBLIC_IP,
//       portRange: { min: 40000, max: 40100 },
//     },
//   ]
// });
// router.createWebRtcTransport({ webRtcServer })
