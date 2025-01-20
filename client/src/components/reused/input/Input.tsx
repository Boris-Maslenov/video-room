import { FC } from "react";
import classNames from "classnames";

type InputProps = JSX.IntrinsicElements["input"];

const Input: FC<InputProps> = (props) => {
  return (
    <div className={classNames("vr-input")}>
      <input {...props} />
    </div>
  );
};

export default Input;
