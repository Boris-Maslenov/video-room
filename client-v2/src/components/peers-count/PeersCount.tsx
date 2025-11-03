import "./PeersCount.style.scss";
import { UsersIcon } from "../icons";
import { FC } from "react";

const PeersCount: FC<{ count: number }> = ({ count }) => {
  return (
    <div className="PeersCount">
      <span>{count}</span>
      <UsersIcon />
    </div>
  );
};

export default PeersCount;
