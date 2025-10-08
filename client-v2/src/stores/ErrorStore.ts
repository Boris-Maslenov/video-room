import { makeAutoObservable } from "mobx";
import { RootStore } from "./RootStore";

class ErrorStore {
  root: RootStore;
  private _errorsStack: Error[] = [];
  constructor(root: RootStore) {
    this.root = root;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  set errorsStack(errors: Error[]) {
    this._errorsStack = errors;
  }

  get errorsStack() {
    return this._errorsStack;
  }

  setError(error: Error | string) {
    const newError = error instanceof Error ? error : new Error(error);

    if (newError.message === this._errorsStack.at(-1)?.message) {
      return;
    }
    this._errorsStack = [...this._errorsStack, newError];
  }

  popError() {
    this._errorsStack = this._errorsStack.slice(0, -1);
  }
}

export default ErrorStore;
