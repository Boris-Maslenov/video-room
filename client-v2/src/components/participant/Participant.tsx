import "./Participant.styles.scss";
import { FC } from "react";
import { ClientRemotePeer } from "../../stores/MediasoupClientStore";
import ParticipantLabel from "../participant-label/ParticipantLabel";
import MediaRenderer from "../mediaRenderer/MediaRenderer";

const Participant: FC<{ peer: ClientRemotePeer }> = ({ peer }) => {
  const hasVideoTrack = peer.mediaStream.getVideoTracks().length > 0;

  return (
    <div className="Participant">
      {!hasVideoTrack ? (
        <ParticipantLabel />
      ) : (
        <MediaRenderer stream={peer.mediaStream} />
      )}
      <div className="ParticipantInfo">{peer.name}</div>
    </div>
  );
};

export default Participant;
