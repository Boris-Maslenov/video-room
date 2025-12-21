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

type ReturnType = { transportParams: TransportParams; transport: Transport };

const ips = [
  {
    ip: "0.0.0.0",
    announcedIp: PUBLIC_IP,
  },
];

export async function createWebRtcTransport(
  router: Router
): Promise<ReturnType> {
  const transport = await router.createWebRtcTransport({
    listenIps: ips,
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
