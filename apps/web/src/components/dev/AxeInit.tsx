"use client";

import * as React from "react";
import * as ReactDOM from "react-dom";
import { useEffect } from "react";

/**
 * Audit accessibilité en dev uniquement (@axe-core/react).
 */
export function AxeInit() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      return;
    }
    let cancelled = false;
    void import("@axe-core/react").then((axe) => {
      if (cancelled) {
        return;
      }
      axe.default(React, ReactDOM, 1000);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
