import "./Button.scss";
import { type FC, type ReactNode } from "react";
import classNames from "classnames";

interface ButtonProps {
  children?: ReactNode;
  size?: "smal" | "medium" | "large";
  variant?: "classic" | "solid" | "soft" | "surface" | "outline";
  color?: "default";
  loading?: false;
  disabled?: boolean;
  onClick: () => void;
}

const Button: FC<ButtonProps> = ({
  children,
  size,
  variant,
  disabled = false,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={classNames(
        "Button",
        `size-${size ?? "medium"}`,
        `variant-${variant ?? "classic"}`,
        `color-${variant ?? "default"}`
      )}
    >
      {children}
    </button>
  );
};

export default Button;
