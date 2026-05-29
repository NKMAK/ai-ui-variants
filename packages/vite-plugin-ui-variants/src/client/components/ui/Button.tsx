/** @jsxImportSource preact */
import type { ComponentChildren, JSX } from "preact";

type ButtonVariant = "primary" | "ghost";

type ButtonProps = {
  children: ComponentChildren;
  disabled?: boolean;
  variant?: ButtonVariant;
  type?: "button" | "submit";
  onClick?: JSX.MouseEventHandler<HTMLButtonElement>;
};

export function Button({
  children,
  disabled = false,
  variant = "ghost",
  type = "button",
  onClick,
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`ui-agent-button ui-agent-button--${variant}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
