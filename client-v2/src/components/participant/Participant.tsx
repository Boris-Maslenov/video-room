import "./Participant.styles.scss";
import { FC, memo } from "react";
import { ClientRemotePeer } from "../../stores/MediasoupClientStore";
import ParticipantLabel from "../participant-label/ParticipantLabel";
import MediaRenderer from "../mediaRenderer/MediaRenderer";
import classNames from "classnames";

const Participant: FC<{ peer: ClientRemotePeer }> = memo(({ peer }) => {
  const videoTrack = peer.mediaStream.getVideoTracks()[0];

  return (
    <div
      data-peer-id={peer.id}
      className={classNames("Participant", { "video-active": videoTrack })}
    >
      <ParticipantLabel />
      <MediaRenderer stream={peer.mediaStream} />
      <div className="ParticipantInfo">{peer.name}</div>
    </div>
  );
});

export default Participant;
