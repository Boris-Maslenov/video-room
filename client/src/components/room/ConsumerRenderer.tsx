import { FC, memo, useRef, useEffect, useState } from "react";
import classNames from "classnames";
import Button from "../reused/button/Button";
import {
  ScaleIcon,
  MicOnIcon,
  DotsFadeAnimateIcon,
  MicOffIcon,
} from "../icons";

const ConsumerRenderer: FC<{
  stream: MediaStream;
  isSelf: boolean;
  peerName: string;
  micOn: boolean;
}> = memo(({ stream, isSelf, peerName, micOn }) => {
  const mediaElRef = useRef<HTMLVideoElement>(null);
  const [readyVideo, setReadiVideo] = useState(false);

  useEffect(() => {
    console.log();
    if (mediaElRef.current) {
      mediaElRef.current.srcObject = !isSelf
        ? stream
        : new MediaStream(stream.getVideoTracks());
      mediaElRef.current.playsInline = true;
      mediaElRef.current.onloadedmetadata = () => {
        setReadiVideo(true);
      };
    }
  }, [mediaElRef]);

  return (
    <div className="media-module">
      <div className="media-module__background"></div>
      <div className="media-module__root">
        {readyVideo && (
          <div className="media-module__popup">
            <div style={{ zIndex: 1, position: "relative" }}>
              <Button icon={true} onClick={() => {}} title="Развернуть">
                <ScaleIcon />
              </Button>
            </div>
          </div>
        )}
        <video
          className={classNames("media-elem", {
            "media-elem__self": isSelf,
          })}
          autoPlay
          ref={mediaElRef}
        ></video>
        {!readyVideo && (
          <div className="media-module__spinner">
            <DotsFadeAnimateIcon />
          </div>
        )}
      </div>
      <div className="media-module__content">
        {peerName}
        <div className="media-module__actions">
          {micOn ? <MicOnIcon /> : <MicOffIcon />}
        </div>
      </div>
    </div>
  );
});

export default ConsumerRenderer;
