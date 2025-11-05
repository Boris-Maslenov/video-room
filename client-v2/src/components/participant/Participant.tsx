import "./Participant.styles.scss";
import { FC, memo, useRef, useEffect, useState } from "react";
import { ClientRemotePeer } from "../../stores/MediasoupClientStore";
import ParticipantLabel from "../participant-label/ParticipantLabel";
import MediaRenderer from "../mediaRenderer/MediaRenderer";
import classNames from "classnames";
import ParticipantInfo from "./ParticipantInfo";
import { waitForFirstNewFrame } from "../../utils/mediaUtils";

const Participant: FC<{ peer: ClientRemotePeer }> = memo(({ peer }) => {
  const stream = peer.mediaStream;
  const videoTrack = peer.mediaStream.getVideoTracks()[0];
  const videoConsumer = peer.consumers.find((c) => c.kind === "video");
  const videoConsumerIsPause = videoConsumer?.paused;
  const isVideoActive = videoTrack && videoConsumer?.paused !== true;
  const [isVideoReady, setIsVideoReady] = useState(false);

  const mediaElRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (mediaElRef.current && stream) {
      mediaElRef.current.srcObject = stream;
      mediaElRef.current.playsInline = true;
    }
  }, [stream]);

  useEffect(() => {
    if (!mediaElRef.current) {
      return;
    }

    if (videoConsumerIsPause) {
      setIsVideoReady(false);
    } else {
      waitForFirstNewFrame(mediaElRef.current!, {}).then(() => {
        setIsVideoReady(true);
      });
    }
  }, [videoConsumerIsPause]);

  return (
    <div
      data-peer-id={peer.id}
      className={classNames("Participant", {
        "video-active": isVideoActive && isVideoReady,
      })}
    >
      <ParticipantLabel />
      <MediaRenderer ref={mediaElRef} />
      <ParticipantInfo name={peer.name} micState={peer.micOn} />
    </div>
  );
});

export default Participant;
