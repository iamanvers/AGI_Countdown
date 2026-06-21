"use client";

import type { DefinitionId } from "@/lib/engine-state";
import { definitions } from "@/lib/engine-state";

type DefinitionToggleProps = {
  active: DefinitionId;
  onChange: (definition: DefinitionId) => void;
  disabled?: boolean;
};

export function DefinitionToggle({ active, onChange, disabled }: DefinitionToggleProps) {
  return (
    <div
      aria-label="AGI definition"
      className="grid w-full grid-cols-3 rounded-full border border-[rgb(var(--line)/0.78)] bg-[rgb(var(--panel)/0.78)] p-1 shadow-sm backdrop-blur md:w-auto"
      role="radiogroup"
    >
      {definitions.map((definition) => {
        const isActive = definition.id === active;

        return (
          <button
            aria-checked={isActive}
            className={[
              "focus-ring tabular relative rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors sm:px-4",
              isActive
                ? "bg-[rgb(var(--accent-rgb))] text-[rgb(var(--accent-contrast))]"
                : "text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]"
            ].join(" ")}
            disabled={disabled}
            key={definition.id}
            onClick={() => onChange(definition.id)}
            role="radio"
            type="button"
          >
            <span className="hidden sm:inline">{definition.label}</span>
            <span className="sm:hidden">{definition.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
