import { FC, ReactNode } from "react";
import ModalComponent from "react-modal";
import { CloseIcon } from "../../icons/CloseIcon";
import { mainStyle } from "./Modal.styles";
import "./Modal.styles.css";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

const Modal: FC<ModalProps> = ({ isOpen, onClose, children }) => {
  return (
    <ModalComponent
      isOpen={isOpen}
      style={mainStyle}
      ariaHideApp={false}
      onRequestClose={onClose}
    >
      <button className="modal-close-button" title="Close" onClick={onClose}>
        <CloseIcon />
      </button>
      {children}
    </ModalComponent>
  );
};
export default Modal;
