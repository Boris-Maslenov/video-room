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

const iconSize = {
  width: "19px",
  height: "19px",
};

const MicSwitch: FC<{ on: boolean }> = ({ on }) => {
  return on ? <MicLevel /> : <MicOffIcon {...iconSize} />;
};

const CamSwitch: FC<{ on: boolean }> = ({ on }) => {
  return on ? <CamOnIcon {...iconSize} /> : <CamOffIcon {...iconSize} />;
};

const ScreenSwitch: FC<{ on: boolean }> = ({ on }) => {
  return on ? (
    <ScreenShareOnIcon {...iconSize} />
  ) : (
    <ScreenShareOffIcon {...iconSize} />
  );
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
  return (
    <div className="ActionsPanel">
      <div className="left-item">
        <button
          className="IconButton"
          onClick={() => onPanelAction("shared")}
          disabled={disabled["shared"]}
        >
          <LinkIcon {...iconSize} />
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
          <CloseIcon {...iconSize} />
        </button>
      </div>
    </div>
  );
};

export default ActionPanel;
