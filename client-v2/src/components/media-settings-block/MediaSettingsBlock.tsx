import "./MediaSettingsBlock.style.scss";
import { FC } from "react";
import { observer } from "mobx-react-lite";
import { useDevicesStore } from "../../context/StoresProvider";
import VRSelect from "../select/VRSelect";
import VRSwitch from "../shared/switch/Switch";
import Loader from "../shared/loader/Loader";

const MediaSettingsBlock: FC = () => {
  const devicesStore = useDevicesStore();
  const selectedMic = devicesStore.selectedMic;
  const selectedCam = devicesStore.selectedCam;
  const micsDevices = devicesStore.mics;
  const camDevices = devicesStore.cams;
  const micOn = devicesStore.micOn;
  const camOn = devicesStore.camOn;
  const isLoading = devicesStore.isMediaDevicesLoading;

  const getOptions = (values: MediaDeviceInfo[]) => {
    return values.map((v) => ({ label: v.label, value: v.deviceId }));
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
              devicesStore.setDevice(value, "videoinput")
            }
          />
        </div>
      </div>
      <div className="MediaSettingsRow">
        <div className="Col Col-30">Микрофон</div>
        <div className="Col Col-70">
          <VRSelect
            value={selectedMic ?? ""}
            placeholder="..."
            options={getOptions(micsDevices)}
            onValueChange={(value) =>
              devicesStore.setDevice(value, "audioinput")
            }
          />
        </div>
      </div>
      <div className="MediaSettingsRow">
        <div className="Col Col-80">Включить камеру</div>
        <div className="Col Col-20 flex-center-right">
          <VRSwitch
            disabled={camDevices.length === 0}
            checked={camOn && camDevices.length > 0}
            onCheckedChange={(checked) => {
              devicesStore.toggleCam(checked);
            }}
          />
        </div>
      </div>
      <div className="MediaSettingsRow">
        <div className="Col Col-80">Включить микрофон</div>
        <div className="Col Col-20 flex-center-right">
          <VRSwitch
            disabled={micsDevices.length === 0}
            checked={micOn && micsDevices.length > 0}
            onCheckedChange={(checked) => {
              devicesStore.toggleMic(checked);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default observer(MediaSettingsBlock);
