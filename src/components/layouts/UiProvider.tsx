"use client";

import { createContext, useContext, useMemo } from "react";
import {
  densityForContext,
  type UiContext,
  type UiDensity,
} from "@/lib/ui/context";
import { useBreakpoint, type BreakpointBucket } from "@/lib/ui/use-breakpoint";

interface UiState {
  context: UiContext;
  density: UiDensity;
  breakpoint: BreakpointBucket;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const UiContextReact = createContext<UiState | null>(null);

export function UiProvider({
  context,
  children,
}: {
  context: UiContext;
  children: React.ReactNode;
}) {
  const breakpoint = useBreakpoint();
  const value = useMemo<UiState>(
    () => ({
      context,
      density: densityForContext(context),
      breakpoint,
      isMobile: breakpoint === "mobile",
      isTablet: breakpoint === "tablet",
      isDesktop: breakpoint === "desktop",
    }),
    [context, breakpoint],
  );

  return (
    <UiContextReact.Provider value={value}>{children}</UiContextReact.Provider>
  );
}

export function useUiContext(): UiState {
  const ctx = useContext(UiContextReact);
  if (!ctx) {
    return {
      context: "consumer",
      density: "comfortable",
      breakpoint: "mobile",
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    };
  }
  return ctx;
}
