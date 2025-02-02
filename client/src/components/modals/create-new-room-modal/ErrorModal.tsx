import { FC } from "react";
import Modal from "../../reused/modal/Modal";

type ErrorModalPropsType = {
  isOpen: boolean;
  onClose: () => void;
  message: string;
};

const ErrorModal: FC<ErrorModalPropsType> = ({
  isOpen,
  onClose,
  message = "",
}) => {
  if (!isOpen) return <></>;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={"modal-header"}>
        <span style={{ fontSize: "32px", fontWeight: 400, lineHeight: 1 }}>
          Ошибка
        </span>
      </div>
      <div className={"modal-center"}>{message}</div>
    </Modal>
  );
};

export default ErrorModal;
