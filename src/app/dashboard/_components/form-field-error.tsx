type FormFieldErrorProps = {
  message?: string;
};

export function FormFieldError({ message }: FormFieldErrorProps) {
  if (!message) {
    return null;
  }

  return <p className="text-destructive text-sm">{message}</p>;
}
