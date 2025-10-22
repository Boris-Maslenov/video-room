import { FC } from "react";
import "./ParticipantLabel.styles.scss";
import { UserIcon } from "../icons";

const ParticipantLabel: FC = () => {
  return (
    <div className="ParticipantLabel">
      <UserIcon />
    </div>
  );
};

export default ParticipantLabel;
