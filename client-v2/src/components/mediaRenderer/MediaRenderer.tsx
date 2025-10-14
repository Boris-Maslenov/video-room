import { FC, useRef, memo, useEffect } from "react";

import "./MediaRenderer.styles.scss";

const MediaRenderer: FC<{ stream: MediaStream | null }> = memo(({ stream }) => {
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
