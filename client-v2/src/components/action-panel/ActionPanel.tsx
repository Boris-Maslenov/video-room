import { FC } from "react";
import "./ActionPanel.styles.scss";
import {
  MicOnIcon,
  MicOffIcon,
  CamOnIcon,
  CamOffIcon,
  ScreenShareOnIcon,
  ScreenShareOffIcon,
  LinkIcon,
  CloseIcon,
} from "../icons";

const MicSwitch: FC<{ on: boolean }> = ({ on }) => {
  return on ? <MicOnIcon /> : <MicOffIcon />;
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
};

export type ActionTypes = "mic" | "cam" | "screen" | "shared" | "exit";

const ActionPanel: FC<ActionPanelProps> = ({
  onPanelAction,
  micState,
  camState,
}) => {
  return (
    <div className="ActionsPanel">
      <div className="left-item">
        <button className="IconButton" onClick={() => onPanelAction("shared")}>
          <LinkIcon />
        </button>
      </div>
      <div className="center-item">
        <button className="IconButton" onClick={() => onPanelAction("mic")}>
          <MicSwitch on={micState} />
        </button>
        <button className="IconButton" onClick={() => onPanelAction("cam")}>
          <CamSwitch on={camState} />
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
