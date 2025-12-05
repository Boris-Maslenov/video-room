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

type ReturnType = { transportParams: TransportParams; transport: Transport };

const local = [
  {
    ip: "192.168.0.103",
    announcedIp: "192.168.0.103",
  },
];

// const vps = [
//   {
//     ip: "0.0.0.0",
//     announcedIp: "217.114.8.81",
//   },
// ];

export async function createWebRtcTransport(
  router: Router
): Promise<ReturnType> {
  const transport = await router.createWebRtcTransport({
    listenIps: local,
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
  });

  const transportParams = {
    id: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters,
  };

  return { transport, transportParams };
}
