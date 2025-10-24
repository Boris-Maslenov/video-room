import "./Participant.styles.scss";
import { FC } from "react";
import { MicOffIcon } from "../icons";

const ParticipantInfo: FC<{ name: string; micState: boolean }> = ({
  name,
  micState,
}) => {
  return (
    <div className="ParticipantInfo">
      <span>{name}</span>
      {!micState && <MicOffIcon width="18px" height="18px" />}
    </div>
  );
};

export default ParticipantInfo;
