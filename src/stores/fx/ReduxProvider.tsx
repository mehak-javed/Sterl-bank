"use client";

import { useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { makeFxStore } from "./store";

export function ReduxProvider({ children }: { children: ReactNode }) {
  const [store] = useState(makeFxStore);
  return <Provider store={store}>{children}</Provider>;
}
