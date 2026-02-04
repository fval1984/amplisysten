import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:text-white",
  secondary:
    "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 disabled:bg-zinc-100",
  ghost: "bg-transparent text-zinc-700 hover:bg-zinc-100",
  danger:
    "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 disabled:text-white",
};

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
