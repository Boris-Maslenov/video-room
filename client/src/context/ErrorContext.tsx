import { createContext, ReactNode, useState, FC } from "react";
import ErrorModal from "../components/modals/create-new-room-modal/ErrorModal";

type Props = {
  children?: ReactNode;
};

export const ErrorContext = createContext({
  errors: [] as Error[],
  addError: (_: Error) => {},
  removeError: () => {},
});

const ErrorProvider: FC<Props> = ({ children }) => {
  const [errors, setErrors] = useState<Error[]>([]);

  const addError = (error: Error) => {
    setErrors((prevErrors) => {
      if (prevErrors.some(({ message }) => message === error.message)) {
        return prevErrors;
      }

      return [...prevErrors, error];
    });
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
