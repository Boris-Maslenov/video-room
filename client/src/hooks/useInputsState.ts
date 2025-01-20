import { useState, ChangeEvent } from "react";

const useInputsState = (
  initialState = {}
): [Record<string, any>, (a: ChangeEvent<HTMLInputElement>) => void] => {
  const [inputsState, setInputsState] = useState(initialState);

  const setValue = (e: ChangeEvent<HTMLInputElement>) => {
    setInputsState((state) => ({ ...state, [e.target.name]: e.target.value }));
  };

  return [inputsState, setValue];
};

export default useInputsState;
