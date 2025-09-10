import "./Fieldset.scss";
import { FC } from "react";
import Input, { InputProps } from "../input/Input";

type PropsType = {
  inputProps?: InputProps;
  label?: string;
};

const Fieldset: FC<PropsType> = ({ inputProps, label }) => {
  const id = inputProps?.name ?? "";
  return (
    <fieldset className="Fieldset">
      {label && (
        <label className="Label" htmlFor={id}>
          {label}
        </label>
      )}
      <Input {...inputProps} id={id} />
    </fieldset>
  );
};

export default Fieldset;
