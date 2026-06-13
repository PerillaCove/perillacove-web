import { useState, useEffect, useMemo } from "react";

export type FormValue = string | number | boolean | string[];

export interface FormState {
  [key: string]: FormValue;
}

export interface FormErrors {
  [key: string]: string | undefined;
}

type ValidateFunction<T extends FormState> = (formState: T) => FormErrors;
type SubmissionSuccessCallback<T extends FormState> = (formState: T) => void;

export const useForm = <T extends FormState>(
  initialState: T,
  validate: ValidateFunction<T>,
  onSubmissionSuccess: SubmissionSuccessCallback<T>,
) => {
  const [formState, setFormState] = useState<T>(initialState);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormState((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormState((prevState) => ({ ...prevState, [name]: checked }));
  };

  const handleSelectChange = (value: FormValue, name: string) => {
    setFormState((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleValueChange = (key: keyof T, value: FormValue) => {
    setFormState((prevState) => ({ ...prevState, [key]: value }));
  };

  const handleExternalStateChange = (key: keyof T, value: FormValue) => {
    setFormState((prevState) => ({ ...prevState, [key]: value }));
  };

  const validateForm = () => {
    const errors = validate(formState);
    setFormErrors(errors);
    return !Object.values(errors).some((error) => !!error);
  };

  const isFormValid = useMemo(() => {
    return !Object.values(validate(formState)).some((error) => !!error);
  }, [formState, validate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmissionSuccess(formState);
    }
  };

  useEffect(() => {
    setFormState(initialState);
  }, [initialState, setFormState]);

  return {
    formState,
    formErrors,
    handleInputChange,
    handleCheckboxChange,
    handleSelectChange,
    handleValueChange,
    handleSubmit,
    handleExternalStateChange,
    isFormValid,
  };
};
