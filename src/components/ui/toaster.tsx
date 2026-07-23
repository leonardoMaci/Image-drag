"use client";

import { cn } from "@/lib/utils";
import { useToastStore } from "@/stores/toast-store";

const kindStyles = {
  success: "border-green-200 bg-green-50 text-green-800",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-slate-200 bg-white text-slate-800",
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2"
      aria-live="polite"
      role="status"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto rounded-md border px-4 py-3 text-sm shadow-md",
            kindStyles[t.kind]
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <span>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
          {t.action && (
            <button
              onClick={() => {
                t.action?.onClick();
                dismiss(t.id);
              }}
              className="mt-2 font-medium underline"
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
