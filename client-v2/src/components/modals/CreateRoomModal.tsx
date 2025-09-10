import { FC } from "react";
import Modal, { ModalProps } from "../shared/modal/Modal";
import Fieldset from "../shared/fieldset/Fieldset";
import useInputsState from "../../hooks/useInputsState";

type PropsType = Partial<Omit<ModalProps, "onSucces">> & {
  onSucces: (peerName: string) => void;
};

const CreateRoomModal: FC<PropsType> = ({ onOpenChange, onSucces }) => {
  const [fields, setValue] = useInputsState();
  return (
    <Modal
      title="Создание новой комнаты"
      onOpenChange={onOpenChange!}
      open={true}
      onSucces={() => onSucces(fields["peerName"] ?? "")}
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

export default CreateRoomModal;
