import "./Participant.styles.scss";
import { FC, memo } from "react";
import { ClientRemotePeer } from "../../stores/MediasoupClientStore";
import ParticipantLabel from "../participant-label/ParticipantLabel";
import MediaRenderer from "../mediaRenderer/MediaRenderer";
import classNames from "classnames";
import ParticipantInfo from "./ParticipantInfo";

const Participant: FC<{ peer: ClientRemotePeer }> = memo(({ peer }) => {
  const videoTrack = peer.mediaStream.getVideoTracks()[0];
  const videoConsumer = peer.consumers.find((c) => c.kind === "video");
  const isVideoActive = videoTrack && videoConsumer?.paused !== true;

  return (
    <div
      data-peer-id={peer.id}
      className={classNames("Participant", { "video-active": isVideoActive })}
    >
      <ParticipantLabel />
      <MediaRenderer stream={peer.mediaStream} />
      <ParticipantInfo name={peer.name} micState={peer.micOn} />
    </div>
  );
});

export default Participant;
