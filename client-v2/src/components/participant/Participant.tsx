import "./Participant.styles.scss";
import { FC, useRef, useEffect, useState } from "react";
import { ClientRemotePeer } from "../../stores/MediasoupClientStore";
import ParticipantLabel from "../participant-label/ParticipantLabel";
import MediaRenderer from "../mediaRenderer/MediaRenderer";
import classNames from "classnames";
import ParticipantInfo from "./ParticipantInfo";
import {
  calcNetworkQuality,
  waitForFirstNewFrame,
} from "../../utils/mediaUtils";
import Loader from "../shared/loader/Loader";
import { observer } from "mobx-react-lite";
import { useMediaSoupStore } from "../../context/StoresProvider";
import { QualitySignalIcon } from "../icons/index";

const Participant: FC<{ peer: ClientRemotePeer }> = observer(({ peer }) => {
  console.log("Render Participant", peer.name);
  const mediaSoupStore = useMediaSoupStore();
  const mediaElRef = useRef<HTMLVideoElement>(null);
  const stream = peer.mediaStream;
  const isSelf = !!peer.isSelf;
  const videoTrack = stream.getVideoTracks()[0];
  const videoConsumer = peer.consumers.find(
    (c) => c.appData.source === "video"
  );
  const videoConsumerIsPaused = videoConsumer?.paused === true;
  const isActiveSpeaker =
    !isSelf && mediaSoupStore.getActiveSpeakers.some((id) => id === peer.id);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const isVideoEnabled =
    videoTrack &&
    videoConsumer &&
    !videoConsumerIsPaused &&
    isVideoLoaded &&
    !isVideoLoading;

  const isViewVideo = isSelf ? videoTrack : isVideoEnabled;
  const isViewLoader = !isSelf && isVideoLoading;
  const networkQ = calcNetworkQuality(
    Math.min(
      ...Object.values(
        isSelf ? mediaSoupStore.networkQuality || {} : peer.networkQuality || {}
      )
    )
  );

  useEffect(() => {
    if (mediaElRef.current && stream) {
      mediaElRef.current.srcObject = stream;
      mediaElRef.current.playsInline = true;
    }
  }, [stream]);

  // если видео трека нет, то устанавливаем IsVideoLoaded = false
  useEffect(() => {
    if (!videoTrack) {
      setIsVideoLoaded(false);
    }
  }, [videoTrack]);

  // дожидаемся первого кадра перед показои видео
  useEffect(() => {
    if (videoConsumerIsPaused || !videoConsumer) {
      setIsVideoLoaded(false);
    } else {
      setIsVideoLoading(true);
      mediaElRef.current &&
        waitForFirstNewFrame(mediaElRef.current, {})
          .then(() => {
            setIsVideoLoaded(true);
          })
          .finally(() => {
            setIsVideoLoading(false);
          });
    }
  }, [videoConsumerIsPaused, videoConsumer]);

  return (
    <div
      data-peer-id={peer.id}
      className={classNames("Participant", {
        "video-active": isViewVideo,
        "audio-active": isActiveSpeaker,
      })}
    >
      {true && (
        <div className="LowSignalBlock">
          <div className={classNames("quality", networkQ)}>
            <QualitySignalIcon quality={networkQ} />
          </div>
        </div>
      )}
      {isViewLoader ? <Loader /> : <ParticipantLabel />}
      <MediaRenderer ref={mediaElRef} />
      <ParticipantInfo name={peer.name} micState={peer.micOn} />
    </div>
  );
});

export default Participant;
