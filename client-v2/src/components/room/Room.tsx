import { useCallback, useMemo } from "react";
import {
  useDevicesStore,
  useMediaSoupStore,
} from "../../context/StoresProvider";
import { observer } from "mobx-react-lite";
import Participant from "../participant/Participant";
import ActionPanel, { ActionTypes } from "../action-panel/ActionPanel";
import ScreenSharePresentation from "../screen-presentation/ScreenSharePresentation";
import "./Room.styles.scss";
import MediaSlider from "../media-slider/MediaSlider";

const Room = () => {
  const devicesStore = useDevicesStore();
  const mediaSoupStore = useMediaSoupStore();
  const peersCount = mediaSoupStore.peersCount;
  const selfPeer = mediaSoupStore.selfPeer;
  const remotePeers = mediaSoupStore.remotePeers;
  const mics = devicesStore.mics;
  const cams = devicesStore.cams;
  const allowMic = devicesStore.allowMic;
  const allowCam = devicesStore.allowCam;
  const isSelfScreenShare = Boolean(devicesStore.screenStream);
  const isRemoteScreenMode = mediaSoupStore.isRemoteScreenActive;
  const screenShareMode = isSelfScreenShare || isRemoteScreenMode;
  const disabledActions: Partial<Record<ActionTypes, boolean>> = useMemo(() => {
    return {
      screen: isRemoteScreenMode,
      mic: mics.length === 0 || !allowMic,
      cam: cams.length === 0 || !allowCam,
    };
  }, [isRemoteScreenMode, devicesStore.mics, devicesStore.cams]);

  const handlePanelAction = (action: ActionTypes) => {
    switch (action) {
      case "mic": {
        devicesStore.toggleMic(!devicesStore.micOn);
        break;
      }
      case "cam": {
        devicesStore.toggleCam(!devicesStore.camOn);
        break;
      }
      case "screen": {
        devicesStore.toggleScreenShare(!devicesStore.screenStream);
        break;
      }
      case "exit": {
        mediaSoupStore.endCall();
        break;
      }
      default: {
        console.log("unnown action");
      }
    }
  };

  const changeOrUpdateSlideHandle = useCallback((ids: string[]) => {
    mediaSoupStore.manageSlideConsumers(ids);
  }, []);

  return (
    <div className="Room">
      <div className="MediaCanvas">
        <MediaSlider onChangeOrUpdateSlide={changeOrUpdateSlideHandle}>
          {selfPeer && <Participant key={selfPeer.id} peer={selfPeer} />}
          {remotePeers.map((p) => (
            <Participant key={p.id} peer={p} />
          ))}
        </MediaSlider>
        {screenShareMode && (
          <ScreenSharePresentation
            stream={
              isRemoteScreenMode
                ? mediaSoupStore.remoteScreenStream
                : devicesStore.screenStream
            }
          />
        )}
      </div>
      <ActionPanel
        onPanelAction={handlePanelAction}
        micState={devicesStore.micOn}
        camState={devicesStore.camOn}
        screenState={Boolean(devicesStore.screenStream)}
        disabled={disabledActions}
        peersCount={peersCount}
      />
    </div>
  );
};

export default observer(Room);
