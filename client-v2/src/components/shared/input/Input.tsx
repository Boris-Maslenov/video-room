import { FC } from "react";
import "./Input.scss";
import { ErrorIcon } from "../../icons";
import VRTooltip from "../tooltip/Tooltip";

export type InputProps = JSX.IntrinsicElements["input"] & {
  name: string;
  error?: string;
};

const Input: FC<InputProps> = ({ error, ...props }) => {
  return (
    <div className="Input-wrapper">
      {error && (
        <div className="Input-error">
          <VRTooltip message={error ?? ""}>
            <ErrorIcon />
          </VRTooltip>
        </div>
      )}
      <input {...props} />
    </div>
  );
};

export default Input;
