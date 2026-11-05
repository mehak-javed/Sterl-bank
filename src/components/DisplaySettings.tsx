"use client";

import { useUiStore } from "@/stores/UiStoreProvider";
import type { Theme } from "@/stores/ui-store";

const THEMES: { value: Theme; label: string }[] = [
  { value: "system", label: "Match device" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function DisplaySettings() {
  // One selector per value: this component only re-renders when one of these changes.
  const theme = useUiStore((s) => s.theme);
  const highContrast = useUiStore((s) => s.highContrast);
  const largeText = useUiStore((s) => s.largeText);
  const setTheme = useUiStore((s) => s.setTheme);
  const toggleHighContrast = useUiStore((s) => s.toggleHighContrast);
  const toggleLargeText = useUiStore((s) => s.toggleLargeText);

  return (
    <section aria-labelledby="display-settings-heading" className="glass rounded-2xl p-4">
      <h2 id="display-settings-heading" className="text-lg font-semibold text-heading">
        Display settings
      </h2>

      {/* fieldset + legend: screen readers announce "Theme" before each option. */}
      <fieldset className="mt-3">
        <legend className="text-sm font-medium">Theme</legend>
        <div className="mt-2 flex flex-wrap gap-4">
          {THEMES.map((t) => (
            <label key={t.value} className="flex items-center gap-2">
              <input
                type="radio"
                name="theme"
                value={t.value}
                checked={theme === t.value}
                onChange={() => setTheme(t.value)}
              />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 flex flex-col gap-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={highContrast} onChange={toggleHighContrast} />
          High contrast
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={largeText} onChange={toggleLargeText} />
          Larger text
        </label>
      </div>
    </section>
  );
}
