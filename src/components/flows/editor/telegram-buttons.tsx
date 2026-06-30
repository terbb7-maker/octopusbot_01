"use client";

export type TelegramPreviewButton = {
  color?: string;
  label: string;
  onClick?: () => void;
};

export function TelegramButtons({
  buttons,
  columns = 1,
}: {
  buttons: TelegramPreviewButton[];
  columns?: 1 | 2;
}) {
  if (!buttons.length) return null;

  return (
    <div
      className="mt-2 grid gap-1"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {buttons.map((button, index) => (
        <button
          key={`${button.label}-${index}`}
          type="button"
          onClick={button.onClick}
          className="animate-in fade-in-0 zoom-in-95 rounded-lg px-3 py-2 text-center text-xs font-semibold text-white transition hover:brightness-110"
          style={{ backgroundColor: button.color ?? "#0ea5e9" }}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
}
