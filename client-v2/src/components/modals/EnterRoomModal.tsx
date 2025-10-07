import { FC } from "react";
import Modal, { ModalProps } from "../shared/modal/Modal";
import Fieldset from "../shared/fieldset/Fieldset";
import useInputsState from "../../hooks/useInputsState";

type PropsType = Partial<Omit<ModalProps, "onSucces">> & {
  onSucces: (peerName: string) => void;
};

const EnterRoomModal: FC<PropsType> = ({
  onOpenChange,
  onSucces,
  disabledSuccesButton = false,
}) => {
  const [fields, setValue] = useInputsState({ peerName: "" });
  return (
    <Modal
      title="Подключиться к комнате"
      onOpenChange={onOpenChange!}
      open={true}
      onSucces={() => onSucces(fields["peerName"])}
      disabledSuccesButton={
        (fields["peerName"] as string).trim().length < 3 || disabledSuccesButton
      }
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
    </Modal>
  );
};

export default EnterRoomModal;
