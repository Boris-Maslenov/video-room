import { FC, ReactNode } from "react";
import ModalComponent from "react-modal";
import { CloseIcon } from "../../icons/CloseIcon";
import {
  mainStyle,
  closeButtonStyle,
  contentBlockStyle,
  footerBlockStyle,
} from "./Modal.styles";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

const Modal: FC<ModalProps> = ({ isOpen, onClose, children = "" }) => {
  return (
    <ModalComponent isOpen={isOpen} style={mainStyle} ariaHideApp={false}>
      <button title="Close" onClick={onClose} style={closeButtonStyle}>
        <CloseIcon />
      </button>
      <div style={contentBlockStyle}>{children}</div>
      <div style={footerBlockStyle}></div>
    </ModalComponent>
  );
};
export default Modal;
