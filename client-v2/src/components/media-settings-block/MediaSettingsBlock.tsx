import "./MediaSettingsBlock.style.scss";
import { FC } from "react";
import { observer } from "mobx-react-lite";
import { useDevicesStore } from "../../context/StoresProvider";
import VRSelect from "../shared/select/Select";
import Loader from "../shared/loader/Loader";
import { CamSwitch, MicSwitch } from "../action-panel/ActionPanel";

const MediaSettingsBlock: FC = () => {
  const devicesStore = useDevicesStore();
  const selectedMic = devicesStore.selectedMic;
  const selectedCam = devicesStore.selectedCam;
  const micsDevices = devicesStore.mics;
  const camDevices = devicesStore.cams;
  const micOn = devicesStore.micOn;
  const camOn = devicesStore.camOn;
  const allowMic = devicesStore.allowMic;
  const allowCam = devicesStore.allowCam;
  const isLoading = devicesStore.isMediaDevicesLoading;

  const getOptions = (values: MediaDeviceInfo[]) => {
    return (
      values?.map((v) => ({
        label: v?.label,
        value: v?.deviceId,
      })) ?? []
    );
  };

  return (
    <div className="MediaSettings">
      {isLoading && (
        <div className="MediaSettingsLoader flex-center-center">
          <Loader />
        </div>
      )}
      <div className="MediaSettingsRow">
        <div className="Col Col-30">Камера</div>
        <div className="Col Col-70">
          <VRSelect
            value={selectedCam ?? ""}
            placeholder="..."
            options={getOptions(camDevices)}
            onValueChange={(value) =>
              devicesStore.changeDevice(value, "videoinput")
            }
          />
        </div>
      </div>
      <div className="MediaSettingsRow">
        <div className="Col Col-30">
          <span className="TextEllipsis">Микрофон</span>
        </div>
        <div className="Col Col-70">
          <VRSelect
            value={selectedMic ?? ""}
            placeholder="..."
            options={getOptions(micsDevices)}
            onValueChange={(value) =>
              devicesStore.changeDevice(value, "audioinput")
            }
          />
        </div>
      </div>
      <div className="MediaSettingsRow">
        <div className="Col Col-50">Включить устройство</div>
        <div className="Col Col-50">
          <div className="end-item">
            <button
              className="IconButton"
              onClick={() => devicesStore.toggleMic(!micOn)}
              disabled={!allowMic}
              title={
                micOn && allowMic ? "Выключить микрофон" : "Включить микрофон"
              }
            >
              <MicSwitch on={micOn && allowMic} />
            </button>
            <button
              className="IconButton"
              onClick={() => devicesStore.toggleCam(!camOn)}
              disabled={!allowCam}
              title={!allowCam ? "Выключить камеру" : "Включить камеру"}
            >
              <CamSwitch on={camOn && allowCam} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default observer(MediaSettingsBlock);
