import { FC } from "react";
import "./Input.scss";

export type InputProps = JSX.IntrinsicElements["input"];

const Input: FC<InputProps> = (props) => {
  return (
    <div className="Input-wrapper">
      <input {...props} />
    </div>
  );
};

export default Input;
