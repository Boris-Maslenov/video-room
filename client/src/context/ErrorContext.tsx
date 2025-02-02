import { createContext, ReactNode, useState, FC } from "react";
import ErrorModal from "../components/modals/create-new-room-modal/ErrorModal";

const initialValue = {
  errors: [] as Error[],
  addError: (error: Error) => {},
  removeError: () => {},
};

type Props = {
  children?: ReactNode;
};

export const ErrorContext = createContext(initialValue);

const ErrorProvider: FC<Props> = ({ children }) => {
  const [errors, setErrors] = useState<Error[]>([]);

  const addError = (error: Error) => {
    setErrors((prevErrors) => [...prevErrors, error]);
  };

  const removeError = () => {
    setErrors((errors) => (errors.pop(), [...errors]));
  };

  return (
    <ErrorContext.Provider value={{ errors, addError, removeError }}>
      {children}
      {Boolean(errors.length) && (
        <ErrorModal
          onClose={removeError}
          isOpen={true}
          message={errors[errors.length - 1].message}
        />
      )}
    </ErrorContext.Provider>
  );
};

export default ErrorProvider;
