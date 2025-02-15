import { FC, memo, useRef, useEffect, useState } from "react";
import classNames from "classnames";
import Button from "../reused/button/Button";
import {
  ScaleIcon,
  MicOnIcon,
  CameraOffIcon,
  DotsFadeAnimateIcon,
} from "../icons";

const ConsumerRenderer: FC<{
  stream: MediaStream;
  isSelf: boolean;
  peerName: string;
}> = memo(({ stream, isSelf, peerName }) => {
  const mediaElRef = useRef<HTMLVideoElement>(null);
  const [readiVideo, setReadiVideo] = useState(false);

  useEffect(() => {
    if (mediaElRef.current) {
      mediaElRef.current.srcObject = stream;
      mediaElRef.current.playsInline = true;
      mediaElRef.current.onloadedmetadata = () => {
        setReadiVideo(true);
      };
    }
  }, [mediaElRef.current]);

  return (
    <div className="media-module">
      <div className="media-module__background"></div>
      <div className="media-module__root">
        {readiVideo && (
          <div className="media-module__popup">
            <div style={{ zIndex: 1, position: "relative" }}>
              <Button icon={true} onClick={() => {}} title="Развернуть">
                <ScaleIcon />
              </Button>
            </div>
          </div>
        )}
        <video
          style={{
            visibility: readiVideo ? "visible" : "hidden",
          }}
          className={classNames("media-elem", { "media-elem__self": isSelf })}
          autoPlay
          ref={mediaElRef}
        ></video>

        <div
          className={classNames("media-module__spinner", {
            "media-module__spinner_active": !readiVideo,
          })}
          style={{ height: "100%", display: readiVideo ? "none" : "block" }}
        >
          <DotsFadeAnimateIcon />
        </div>
      </div>
      <div className="media-module__content">
        {peerName}
        {!isSelf && (
          <div className="media-module__actions">
            <Button onClick={() => {}} icon={true}>
              <MicOnIcon />
            </Button>
            <Button onClick={() => {}} icon={true}>
              <CameraOffIcon />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

export default ConsumerRenderer;
