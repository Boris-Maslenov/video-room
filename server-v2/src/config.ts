import { RtpCodecCapability } from "mediasoup/node/lib/types";

export const ROOM_ID = "0";

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
    kind: "video",
    mimeType: "video/VP9",
    clockRate: 90000,
  },
  {
    kind: "audio",
    mimeType: "audio/opus",
    clockRate: 48000,
    channels: 2,
  },
];

export const COLORS = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m", // фиолетовый
  cyan: "\x1b[36m", // голубой
  reset: "\x1b[0m", // Сброс цвета
};
