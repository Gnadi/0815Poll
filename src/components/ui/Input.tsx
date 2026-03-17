"use client";

import {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  forwardRef,
  useId,
} from "react";

type BaseProps = {
  label?: string;
  error?: string;
  multiline?: boolean;
};

type InputOnlyProps = BaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "children"> & {
    multiline?: false;
  };

type TextareaOnlyProps = BaseProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "children"> & {
    multiline: true;
  };

type InputProps = InputOnlyProps | TextareaOnlyProps;

const sharedStyles = `
  w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text text-sm
  placeholder:text-text-muted
  transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary
  disabled:opacity-50 disabled:bg-background disabled:cursor-not-allowed
`;

const errorStyles = "border-danger focus:ring-danger/40 focus:border-danger";

const Input = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  InputProps
>((props, ref) => {
  const autoId = useId();
  const { label, error, multiline, className = "", id, ...rest } = props;
  const inputId = id ?? autoId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-text"
        >
          {label}
        </label>
      )}

      {multiline ? (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          id={inputId}
          rows={4}
          className={`${sharedStyles} resize-y min-h-[80px] ${error ? errorStyles : ""} ${className}`}
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          id={inputId}
          className={`${sharedStyles} ${error ? errorStyles : ""} ${className}`}
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}

      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
