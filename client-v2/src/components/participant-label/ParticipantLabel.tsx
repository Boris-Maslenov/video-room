import { FC } from "react";
import "./ParticipantLabel.styles.scss";
import { UserIcon } from "../icons";

const ParticipantLabel: FC = () => {
  return (
    <div className="ParticipantLabel">
      <UserIcon width="150px" height="150px" />
    </div>
  );
};

export default ParticipantLabel;
