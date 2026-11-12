"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * A button that opens a panel: slides up from the bottom on phones, a centred card on desktop.
 *
 * Built on the browser's own <dialog> element with showModal(), which gives us for free what a
 * hand-made pop-up usually gets wrong: focus moves into the panel and stays there, Esc closes it,
 * the page behind can't be clicked or read by screen readers, and focus returns to the button.
 */
export function Sheet({
  title,
  trigger,
  triggerClassName,
  triggerLabel,
  children,
}: {
  title: string;
  trigger: ReactNode;
  triggerClassName?: string;
  /** Required when the trigger is only an icon: without it, screen readers hear an unnamed button. */
  triggerLabel?: string;
  /** Or a function, given close(), for a form that should close the sheet once it succeeds. */
  children: ReactNode | ((close: () => void) => ReactNode);
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  // The same <dialog>, kept in state too, for the close() handed to children: React's rules say a ref
  // mustn't be read while rendering, and building children() happens during render.
  const [element, setElement] = useState<HTMLDialogElement | null>(null);
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={triggerLabel}
        onClick={() => dialog.current?.showModal()}
        className={triggerClassName}
      >
        {trigger}
      </button>

      <dialog
        ref={(node) => {
          dialog.current = node;
          setElement(node);
        }}
        aria-labelledby={titleId}
        // A click on the dimmed backdrop lands on the <dialog> itself (the panel is a child), so it closes.
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close();
          // Following a link inside the panel: close it, so it isn't still open on the next page.
          if ((event.target as HTMLElement).closest("a")) dialog.current?.close();
        }}
        className="m-0 mt-auto w-full max-w-none rounded-t-3xl border border-line bg-surface p-0 text-foreground backdrop:bg-black/60 sm:m-auto sm:max-w-md sm:rounded-3xl"
      >
        <div className="flex flex-col gap-4 p-5 pb-8 sm:pb-5">
          <div className="flex items-center justify-between">
            <h2 id={titleId} className="text-lg font-semibold text-heading">
              {title}
            </h2>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Close"
              className="chip h-9 w-9"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
          {typeof children === "function" ? children(() => element?.close()) : children}
        </div>
      </dialog>
    </>
  );
}
