export const ROOM_QUERY_KEY = "room_id";

export const SCREEN_PRODUCER_OPTIONS = {
  codecOptions: { videoGoogleStartBitrate: 1200 },
  encodings: [
    {
      maxBitrate: 2_000_000,
      maxFramerate: 15,
      scaleResolutionDownBy: 1,
      scalabilityMode: "L1T2",
    },
  ],
};
