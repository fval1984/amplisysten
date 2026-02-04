import { ReactNode } from "react";

type CardProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  onClick?: () => void;
};

export default function Card({ title, subtitle, children, onClick }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition ${
        onClick ? "cursor-pointer hover:shadow-md" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm text-zinc-500">{title}</span>
        {subtitle ? (
          <span className="text-xl font-semibold text-zinc-900">
            {subtitle}
          </span>
        ) : null}
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
