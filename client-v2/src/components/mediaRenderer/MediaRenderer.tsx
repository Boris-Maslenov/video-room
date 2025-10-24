import { FC, useRef, memo, useEffect } from "react";

import "./MediaRenderer.styles.scss";

const MediaRenderer: FC<{
  stream: MediaStream | null;
  onReady?: () => void;
  onWaiting?: () => void;
}> = memo(({ stream }) => {
  const mediaElRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (mediaElRef.current && stream) {
      mediaElRef.current.srcObject = stream;
      mediaElRef.current.playsInline = true;
    }
  }, [stream]);
  return (
    <video
      className="MediaRenderer"
      autoPlay
      playsInline
      ref={mediaElRef}
    ></video>
  );
});

export default MediaRenderer;

// useEffect(() => {
//   if (!mediaElRef.current) {
//     return;
//   }

//   const onLoadedData = () => onReady(); // первый кадр готов
//   const onCanPlay = () => onReady(); // можно играть
//   const onPlaying = () => onReady(); // реально играет
//   const onWaitingEv = () => onWaiting(); // буферизация/ожидание

//   mediaElRef.current.addEventListener("loadeddata", onLoadedData);
//   mediaElRef.current.addEventListener("canplay", onCanPlay);
//   mediaElRef.current.addEventListener("playing", onPlaying);
//   mediaElRef.current.addEventListener("waiting", onWaitingEv);

//   return () => {
//     if (!mediaElRef.current) {
//       return;
//     }
//     mediaElRef.current.removeEventListener("loadeddata", onLoadedData);
//     mediaElRef.current.removeEventListener("canplay", onCanPlay);
//     mediaElRef.current.removeEventListener("playing", onPlaying);
//     mediaElRef.current.removeEventListener("waiting", onWaitingEv);
//     mediaElRef.current.removeEventListener("stalled", onWaitingEv);
//   };
// }, [videoTrack]);
