import { FC } from "react";
import "./ActionPanel.styles.scss";
import {
  MicOffIcon,
  CamOnIcon,
  CamOffIcon,
  ScreenShareOnIcon,
  ScreenShareOffIcon,
  LinkIcon,
  CloseIcon,
} from "../icons";
import PeersCount from "../peers-count/PeersCount";

import { MicLevel } from "../mic-level/MicLevel";

const MicSwitch: FC<{ on: boolean }> = ({ on }) => {
  return on ? <MicLevel /> : <MicOffIcon />;
};

const CamSwitch: FC<{ on: boolean }> = ({ on }) => {
  return on ? <CamOnIcon /> : <CamOffIcon />;
};

const ScreenSwitch: FC<{ on: boolean }> = ({ on }) => {
  return on ? <ScreenShareOnIcon /> : <ScreenShareOffIcon />;
};

type ActionPanelProps = {
  onPanelAction: (type: ActionTypes) => void;
  micState: boolean;
  camState: boolean;
  screenState: boolean;
  peersCount: number;
  disabled: Partial<Record<ActionTypes, boolean>>;
};

export type ActionTypes = "mic" | "cam" | "screen" | "shared" | "exit";

const ActionPanel: FC<ActionPanelProps> = ({
  onPanelAction,
  micState,
  camState,
  peersCount,
  screenState,
  disabled = {},
}) => {
  console.log("ActionPanel");
  return (
    <div className="ActionsPanel">
      <div className="left-item">
        <button
          className="IconButton"
          onClick={() => onPanelAction("shared")}
          disabled={disabled["shared"]}
        >
          <LinkIcon />
        </button>
        <button className="IconButton" disabled={false}>
          <PeersCount count={peersCount} />
        </button>
      </div>
      <div className="center-item">
        <button
          className="IconButton"
          onClick={() => onPanelAction("mic")}
          disabled={disabled["mic"]}
        >
          <MicSwitch on={micState} />
        </button>
        <button
          className="IconButton"
          onClick={() => onPanelAction("cam")}
          disabled={disabled["cam"]}
        >
          <CamSwitch on={camState} />
        </button>
        <button
          className="IconButton mobile-hidden"
          onClick={() => onPanelAction("screen")}
          disabled={disabled["screen"]}
        >
          <ScreenSwitch on={screenState} />
        </button>
      </div>
      <div className="right-item">
        <button
          className="IconButton color-red"
          onClick={() => onPanelAction("exit")}
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
};

export default ActionPanel;
