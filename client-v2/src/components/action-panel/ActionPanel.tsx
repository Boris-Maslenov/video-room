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
  screenState: boolean;
  disabled: Partial<Record<ActionTypes, boolean>>;
};

export type ActionTypes = "mic" | "cam" | "screen" | "shared" | "exit";

const ActionPanel: FC<ActionPanelProps> = ({
  onPanelAction,
  micState,
  camState,
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
          <LinkIcon />
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
          className="IconButton"
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
