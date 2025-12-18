import { FC } from "react";
import { RemotePeer } from "../../stores/MediasoupClientStore";
import { UserIcon, MicOffIcon, MicOnIcon } from "../icons";
import "./PeersList.style.scss";

const iconSize = {
  width: "18px",
  height: "18px",
};

const Item: FC<{ peer: RemotePeer }> = ({ peer }) => {
  return (
    <li className="ListItem">
      <span className="BoxIcon">
        <UserIcon {...iconSize} />
      </span>
      <span className="PeerName">{peer.name}</span>
      {peer.micOn ? (
        <span className="BoxIcon color-green">
          <MicOnIcon {...iconSize} />
        </span>
      ) : (
        <span className="BoxIcon color-grey">
          <MicOffIcon {...iconSize} />
        </span>
      )}
    </li>
  );
};

const PeersList: FC<{ peers: RemotePeer[] }> = ({ peers }) => {
  return (
    <div className="PeersListContainer">
      <ul className="PeersList">
        {peers.map((p, i) => (
          <Item key={i + p.id} peer={p} />
        ))}
      </ul>
    </div>
  );
};

export default PeersList;
