import "./PeersCount.style.scss";
import { UsersIcon } from "../icons";
import { FC } from "react";

const iconSize = {
  width: "19px",
  height: "19px",
};

const PeersCount: FC<{ count: number }> = ({ count }) => {
  return (
    <div className="PeersCount">
      <span>{count}</span>
      <UsersIcon {...iconSize} />
    </div>
  );
};

export default PeersCount;
