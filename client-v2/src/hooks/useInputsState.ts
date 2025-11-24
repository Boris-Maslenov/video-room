import { useState, ChangeEvent } from "react";

type Input = {
  initialValues: Record<string, any>;
  validationShema: Record<string, [string, (v: string) => boolean]>;
};

type Output = {
  values: Input["initialValues"];
  errors: Record<string, string>;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

const useInputsState: (props: Input) => Output = ({
  initialValues = {},
  validationShema,
}) => {
  const [inputsState, setInputsState] = useState(initialValues);
  const [errors, setErrors] = useState<Output["errors"]>({});

  const setValue = (e: ChangeEvent<HTMLInputElement>) => {
    const validationCallback = validationShema[e.target.name][1] ?? null;
    const name = e.target.name;
    const value = e.target.value;

    if (validationCallback) {
      const isValid = validationCallback(e.target.value);

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
    }

    setInputsState((state) => ({ ...state, [name]: value }));
  };

  return { values: inputsState, onChange: setValue, errors };
};

export default useInputsState;
