import { FC } from "react";
import Modal, { ModalProps } from "../shared/modal/Modal";
import Fieldset from "../shared/fieldset/Fieldset";
import useInputsState from "../../hooks/useInputsState";
import DefaultDialogActions from "../shared/modal/DefaultDialogActions";

type PropsType = Omit<ModalProps, "onSucces"> & {
  onSucces: (peerName: string) => void;
  disabledSuccesButton?: boolean;
};

const EnterRoomModal: FC<PropsType> = ({
  onOpen,
  onSucces,
  disabledSuccesButton = false,
}) => {
  const [fields, setValue] = useInputsState({ peerName: "" });
  return (
    <Modal
      title="Подключиться к комнате"
      onOpen={onOpen}
      open={true}
      onSucces={() => onSucces(fields["peerName"])}
    >
      <div className="fields-container">
        <Fieldset
          inputProps={{
            name: "peerName",
            placeholder: "Ваше Имя",
            onChange: setValue,
          }}
        />
      </div>
      <DefaultDialogActions
        onOpen={onOpen}
        onSucces={() => {
          onSucces(fields["peerName"]);
        }}
        disabledSuccesButton={
          (fields["peerName"] as string).trim().length < 3 ||
          disabledSuccesButton
        }
      />
    </Modal>
  );
};

export default EnterRoomModal;
