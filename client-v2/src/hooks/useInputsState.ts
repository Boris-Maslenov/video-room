import { useState, ChangeEvent } from "react";

type Input = {
  initialValues: Record<string, any>;
  validationShema: Record<string, [string, (v: string) => boolean]>;
};

type Output = {
  values: Input["initialValues"];
  errors: Record<string, string>;
  validate: (a: string, b: any) => boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

const useInputsState: (props: Input) => Output = ({
  initialValues = {},
  validationShema,
}) => {
  const [inputsState, setInputsState] = useState(initialValues);
  const [errors, setErrors] = useState<Output["errors"]>({});

  const validate = (name: string, value: any) => {
    const validationCallback = validationShema[name][1] ?? null;
    if (validationCallback) {
      const isValid = validationCallback(value);

      if (isValid && errors[name]) {
        setErrors((prev) => {
          delete prev[name];
          return prev;
        });
      }

      if (!isValid && !errors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: validationShema[name][0],
        }));
      }

      return isValid;
    }

    return true;
  };

  const setValue = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name;
    const value = e.target.value;

    validate(name, value);
    setInputsState((state) => ({ ...state, [name]: value }));
  };

  return { values: inputsState, onChange: setValue, errors, validate };
};

export default useInputsState;
