import { FC, ReactNode } from "react";

type ButtonPropsType = {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
};

const Button: FC<ButtonPropsType> = ({
  onClick,
  children,
  disabled = false,
}) => {
  return (
    <button disabled={disabled} className="btn" onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;
