import { FC, ReactNode, useRef } from "react";
import ModalComponent from "react-modal";
import { CloseIcon } from "../../icons/CloseIcon";
import "./Modal.styles.css";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

const openAnimate = "animate__zoomIn";
const closeAnimate = "animate__zoomOut";

const Modal: FC<ModalProps> = ({ isOpen, onClose, children }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  const handleClose = () => {
    if (ref.current) {
      const modalElement = ref.current.querySelector(".react-modal-content");
      if (modalElement) {
        modalElement.classList.remove(openAnimate);
        modalElement.classList.add(closeAnimate);
        setTimeout(onClose, 200);
        return;
      }
      onClose();
    }
  };

  return (
    <ModalComponent
      className={{
        base: `react-modal-content animate__animated ${openAnimate}`,
        beforeClose: "",
        afterOpen: "",
      }}
      closeTimeoutMS={10000}
      isOpen={isOpen}
      ariaHideApp={false}
      onRequestClose={handleClose}
      overlayClassName={"react-modal-overlay"}
      overlayRef={(overlayRef) => {
        if (overlayRef) {
          ref.current = overlayRef;
        }
      }}
    >
      <button
        className="modal-close-button"
        title="Close"
        onClick={handleClose}
      >
        <CloseIcon />
      </button>
      {children}
    </ModalComponent>
  );
};
export default Modal;
