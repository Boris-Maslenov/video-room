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
import HVPopover from "../shared/popover/Popover";

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
  peersNames: string[];
  disabled: Partial<Record<ActionTypes, boolean>>;
};

export type ActionTypes = "mic" | "cam" | "screen" | "shared" | "exit";

const ActionPanel: FC<ActionPanelProps> = ({
  onPanelAction,
  micState,
  camState,
  peersCount,
  screenState,
  peersNames,
  disabled = {},
}) => {
  return (
    <div className="ActionsPanel">
      <div className="left-item">
        <button
          className="IconButton"
          onClick={() => onPanelAction("shared")}
          disabled={disabled["shared"]}
          title="Поделиться ссылкой"
        >
          <LinkIcon {...iconSize} />
        </button>
        {peersCount > 1 ? (
          <HVPopover
            content={
              <ul>
                {peersNames.map((name, i) => (
                  <li key={i + name}>{name}</li>
                ))}
              </ul>
            }
          >
            <button className="IconButton" title="Кол-во участников">
              <PeersCount count={peersCount} />
            </button>
          </HVPopover>
        ) : (
          <button className="IconButton" title="Кол-во участников">
            <PeersCount count={peersCount} />
          </button>
        )}
      </div>
      <div className="center-item">
        <button
          className="IconButton"
          onClick={() => onPanelAction("mic")}
          disabled={disabled["mic"]}
          title={micState ? "Выключить микрофон" : "Включить микрофон"}
        >
          <MicSwitch on={micState} />
        </button>
        <button
          className="IconButton"
          onClick={() => onPanelAction("cam")}
          disabled={disabled["cam"]}
          title={camState ? "Выключить камеру" : "Включить камеру"}
        >
          <CamSwitch on={camState} />
        </button>
        <button
          className="IconButton mobile-hidden"
          onClick={() => onPanelAction("screen")}
          disabled={disabled["screen"]}
          title={
            screenState
              ? "Завершить трансляцию экрана"
              : "Начать трансляцию экрана"
          }
        >
          <ScreenSwitch on={screenState} />
        </button>
      </div>
      <div className="right-item">
        <button
          className="IconButton color-red"
          onClick={() => onPanelAction("exit")}
          title="Выйти из комнаты"
        >
          <CloseIcon {...iconSize} />
        </button>
      </div>
    </div>
  );
};

export default ActionPanel;
