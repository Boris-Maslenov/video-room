import { FC, useRef, useEffect, memo, useState } from "react";
import { DotsAnimateIcon } from "../icons";
import "./MediaRenderer.styles.scss";

const Loader: FC = () => (
  <div className="Loader">
    <DotsAnimateIcon width="50px" height="50px" />
  </div>
);

const MediaRenderer: FC<{ stream: MediaStream | null }> = memo(({ stream }) => {
  const mediaElRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mediaElRef.current && stream) {
      mediaElRef.current.srcObject = stream;
      mediaElRef.current.playsInline = true;
      mediaElRef.current.onloadedmetadata = () => {
        setLoading(true);
      };
    }
  }, [stream]);

  return (
    <>
      {!loading && <Loader />}
      <video
        className="MediaRenderer"
        autoPlay
        playsInline
        ref={mediaElRef}
      ></video>
    </>
  );
});

export default MediaRenderer;
