import { FC, ReactNode, ButtonHTMLAttributes } from "react";
import classNames from "classnames";

import Dashboard from "../../dashboard/Dashboard";

type ButtonPropsType = {
  icon?: boolean;
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
};

const Button: FC<ButtonHTMLAttributes<HTMLButtonElement> & ButtonPropsType> = ({
  onClick,
  children,
  disabled = false,
  icon = false,
  ...buttonProps
}) => {
  return (
    <button
      disabled={disabled}
      className={classNames("btn", { btn_icon: icon })}
      onClick={onClick}
      {...buttonProps}
    >
      {children}
    </button>
  );
};

export default Button;
