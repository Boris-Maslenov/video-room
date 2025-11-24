import "./Participant.styles.scss";
import { FC } from "react";
import { MicOffIcon } from "../icons";

const ParticipantInfo: FC<{ name: string; micState: boolean }> = ({
  name,
  micState,
}) => {
  return (
    <div className="ParticipantInfo">
      <span className="ParticipantInfoName">{name}</span>
      {!micState && (
        <span className="ParticipantInfoMic">
          <MicOffIcon width="18px" height="18px" />
        </span>
      )}
    </div>
  );
};

export default ParticipantInfo;
