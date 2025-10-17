import "./ScreenSharePresentation.style.scss";
import { FC, memo, useEffect, useRef } from "react";

type PropType = {
  stream: MediaStream | null;
};

const ScreenSharePresentation: FC<PropType> = memo(({ stream }) => {
  const videoElem = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoElem.current && stream) {
      videoElem.current.srcObject = stream;
      videoElem.current.playsInline = true;
    }
  }, [stream]);
  return (
    <div className="ScreenSharePresentation">
      <video ref={videoElem} autoPlay playsInline></video>
    </div>
  );
});

export default ScreenSharePresentation;
