import { RtpCodecCapability } from "mediasoup/node/lib/types";

export const WS_PORT = 3001;

export const mediaCodecs: RtpCodecCapability[] = [
  {
    kind: "video",
    mimeType: "video/VP8",
    clockRate: 90000,
    parameters: {
      "x-google-start-bitrate": 1000,
    },
  },
  {
    kind: "audio",
    mimeType: "audio/opus",
    clockRate: 48000,
    channels: 2,
  },
];
