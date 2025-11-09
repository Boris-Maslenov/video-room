import { FC } from "react";
import Modal, { ModalProps } from "../shared/modal/Modal";
import Fieldset from "../shared/fieldset/Fieldset";
import useInputsState from "../../hooks/useInputsState";
import DefaultDialogActions from "../shared/modal/DefaultDialogActions";
import MediaSettingsBlock from "../media-settings-block/MediaSettingsBlock";
import { validatePeerName } from "../../utils/formUtils";

type PropsType = Omit<ModalProps, "onSucces"> & {
  onSucces: (peerName: string) => void;
  disabledSuccesButton?: boolean;
  mediaDevices: MediaDeviceInfo[];
  loading: boolean;
  selectedMic: string;
};

const EnterRoomModal: FC<PropsType> = ({
  onOpen,
  onSucces,
  disabledSuccesButton = false,
}) => {
  const { values, onChange, errors } = useInputsState({
    initialValues: { peerName: "" },
    validationShema: {
      peerName: ["Имя должно содержать не менее 3 символов", validatePeerName],
    },
  });

  return (
    <Modal title="Подключиться к комнате" onOpen={onOpen} open={true}>
      <MediaSettingsBlock />
      <div className="fields-container">
        <Fieldset
          inputProps={{
            name: "peerName",
            placeholder: "Ваше Имя",
            onChange: onChange,
            error: errors.peerName,
          }}
        />
      </div>
      <DefaultDialogActions
        onOpen={onOpen}
        onSucces={() => {
          onSucces(values.peerName);
        }}
        disabledSuccesButton={Boolean(errors.peerName) || disabledSuccesButton}
      />
    </Modal>
  );
};

export default EnterRoomModal;
