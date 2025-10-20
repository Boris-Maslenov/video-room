import {
  useDevicesStore,
  useMediaSoupStore,
} from "../../context/StoresProvider";
import { observer } from "mobx-react-lite";
import Participant from "../participant/Participant";
import { ClientRemotePeer, Source } from "../../stores/MediasoupClientStore";
import ActionPanel, { ActionTypes } from "../action-panel/ActionPanel";
import ScreenSharePresentation from "../screen-presentation/ScreenSharePresentation";
import "./Room.styles.scss";
import { Producer } from "mediasoup-client/types";
import { useMemo } from "react";

const Room = () => {
  const devicesStore = useDevicesStore();
  const mediaSoupStore = useMediaSoupStore();
  const remotePeers = mediaSoupStore.remotePeers;
  const isSelfScreenShare = Boolean(devicesStore.screenStream);
  const isRemoteScreenMode = mediaSoupStore.isRemoteScreenActive;
  const screenShareMode = isSelfScreenShare || isRemoteScreenMode;
  //
  const disabledActions: Partial<Record<ActionTypes, boolean>> = useMemo(() => {
    return {
      screen: isRemoteScreenMode,
    };
  }, [isRemoteScreenMode]);

  const getSelfPeer = (): ClientRemotePeer => {
    return {
      id: mediaSoupStore.peerId ?? "",
      roomId: mediaSoupStore.roomId ?? "",
      name: mediaSoupStore.peerName ?? "",
      producersData: (
        [
          mediaSoupStore?.audioProducer,
          mediaSoupStore?.videoProducer,
          mediaSoupStore?.screenProducer,
        ].filter(Boolean) as Producer<{
          source: Source;
        }>[]
      ).map((p) => ({ producerId: p.id, source: p.appData.source })),
      socketId: "",
      isJoined: mediaSoupStore.isJoined,
      status: "online",
      consumers: [],
      mediaStream: new MediaStream(
        devicesStore.videoTrack ? [devicesStore.videoTrack] : []
      ),
    };
  };

  const handlePanelAction = (action: ActionTypes) => {
    switch (action) {
      case "mic": {
        const old = devicesStore.micOn;
        devicesStore.toggleMic(!old);
        break;
      }
      case "cam": {
        const old = devicesStore.camOn;
        devicesStore.toggleCam(!old);
        break;
      }
      case "screen": {
        const old = Boolean(devicesStore.screenStream);
        console.log("1", devicesStore.videoTrack?.readyState);
        devicesStore.toggleScreenShare(!old);
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

  return (
    <div className="Room">
      <div className="MediaCanvas">
        <Participant peer={getSelfPeer()} />
        {remotePeers.map((p) => (
          <Participant key={p.id} peer={p} />
        ))}
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
      />
    </div>
  );
};

export default observer(Room);
