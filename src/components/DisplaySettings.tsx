"use client";

import { useId } from "react";
import { Contrast, Monitor, Moon, Sun, Type, type LucideIcon } from "lucide-react";
import { useUiStore } from "@/stores/UiStoreProvider";
import type { Theme } from "@/stores/ui-store";

const THEMES: { value: Theme; label: string; icon: LucideIcon }[] = [
  { value: "system", label: "Device", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

/**
 * Theme and accessibility options. Real radio buttons and checkboxes underneath (so keyboards and
 * screen readers work as usual), styled as pills and switches.
 *
 * useId gives each copy its own radio-group name: this component appears twice (desktop sidebar and
 * phone "More" panel), and two groups sharing a name would fight over which option is ticked.
 */
export function DisplaySettings() {
  const groupName = useId();
  // One selector per value: this component only re-renders when one of these changes.
  const theme = useUiStore((s) => s.theme);
  const highContrast = useUiStore((s) => s.highContrast);
  const largeText = useUiStore((s) => s.largeText);
  const setTheme = useUiStore((s) => s.setTheme);
  const toggleHighContrast = useUiStore((s) => s.toggleHighContrast);
  const toggleLargeText = useUiStore((s) => s.toggleLargeText);

  return (
    <div className="flex flex-col gap-5">
      {/* fieldset + legend: screen readers announce "Theme" before each option. */}
      <fieldset>
        <legend className="eyebrow text-muted">Theme</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {THEMES.map(({ value, label, icon: Icon }) => (
            <label
              key={value}
              className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-line bg-surface-2 px-2 py-3 text-sm font-medium has-[:checked]:border-2 has-[:checked]:border-accent has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]"
            >
              <input
                type="radio"
                name={groupName}
                value={value}
                checked={theme === value}
                onChange={() => setTheme(value)}
                className="sr-only"
              />
              <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Toggle icon={Contrast} label="High contrast" checked={highContrast} onChange={toggleHighContrast} />
        <Toggle icon={Type} label="Larger text" checked={largeText} onChange={toggleLargeText} />
      </div>
    </div>
  );
}

/** A checkbox that looks like a switch: role="switch" makes screen readers say "on/off". */
function Toggle({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 px-3 py-3 font-medium has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]">
      <span className="flex items-center gap-3">
        <Icon aria-hidden="true" className="h-5 w-5 text-heading" strokeWidth={1.75} />
        {label}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden="true"
        // The knob is inside the track, so the track (the input's sibling) moves it: peer-checked → [&>span].
        className="relative h-6 w-11 shrink-0 rounded-full border border-line bg-background transition-colors peer-checked:btn-primary peer-checked:[&>span]:translate-x-5"
      >
        <span className="absolute top-0.5 left-0.5 h-[1.125rem] w-[1.125rem] rounded-full bg-foreground transition-transform motion-reduce:transition-none" />
      </span>
    </label>
  );
}
