import { useCallback, useEffect, useMemo } from "react";
import {
  useDevicesStore,
  useMediaSoupStore,
  useViewPeerStore,
} from "../../context/StoresProvider";
import { observer } from "mobx-react-lite";
import ActionPanel, { ActionTypes } from "../action-panel/ActionPanel";
import ScreenSharePresentation from "../screen-presentation/ScreenSharePresentation";
import "./Room.styles.scss";
import MediaSlider from "../media-slider/MediaSlider";
import { isMobileDevice } from "../../utils/isMobileDevice";

import { MAX_PEERS_IN_SLIDE } from "../../config";

const Room = () => {
  const devicesStore = useDevicesStore();
  const mediaSoupStore = useMediaSoupStore();
  const viewPeerStore = useViewPeerStore();

  const mics = devicesStore.mics;
  const cams = devicesStore.cams;
  const allowMic = devicesStore.allowMic;
  const allowCam = devicesStore.allowCam;
  const isSelfScreenShare = Boolean(devicesStore.screenStream);
  const isRemoteScreenMode = mediaSoupStore.isRemoteScreenActive;
  const screenShareMode = isSelfScreenShare || isRemoteScreenMode;
  const peersCount = viewPeerStore.peersCount;
  const viewShema = viewPeerStore.getViewShema;
  const activeGroup = viewPeerStore.activePeerGroup;

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
      case "camReverce": {
        if (isMobileDevice()) {
          devicesStore.camReverce();
        }
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
        console.warn("unnown action");
      }
    }
  };

  const onKeydown = (e: KeyboardEvent) => {
    if (e.code === "Space") {
      e.preventDefault();
      devicesStore.toggleMic(!devicesStore.micOn);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, []);

  useEffect(() => {
    mediaSoupStore.manageViewConsumers(activeGroup);
  }, [activeGroup]);

  const changeOrUpdateSlideHandle = useCallback((group: number) => {
    viewPeerStore.activePeerGroup = group;
  }, []);

  const getMaxVisiblePeers = (width: number, _: number): number => {
    switch (true) {
      case width <= 538: {
        return 3;
      }

      default: {
        return MAX_PEERS_IN_SLIDE;
      }
    }
  };

  return (
    <div className="Room">
      <div className="MediaCanvas">
        <MediaSlider
          viewShema={viewShema}
          onChangeOrUpdateSlide={changeOrUpdateSlideHandle}
          onResize={(width, height) => {
            viewPeerStore.maxPeersInSlide = getMaxVisiblePeers(width, height);
          }}
        />
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
        peers={mediaSoupStore.allPeers}
      />
    </div>
  );
};

export default observer(Room);
