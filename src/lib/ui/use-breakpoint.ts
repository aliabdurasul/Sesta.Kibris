"use client";

import { useEffect, useState } from "react";

export type BreakpointBucket = "mobile" | "tablet" | "desktop";

const QUERIES = {
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
} as const;

function getBucket(): BreakpointBucket {
  if (typeof window === "undefined") return "mobile";
  if (window.matchMedia(QUERIES.lg).matches) return "desktop";
  if (window.matchMedia(QUERIES.md).matches) return "tablet";
  return "mobile";
}

export function useBreakpoint(): BreakpointBucket {
  const [bucket, setBucket] = useState<BreakpointBucket>("mobile");

  useEffect(() => {
    setBucket(getBucket());
    const md = window.matchMedia(QUERIES.md);
    const lg = window.matchMedia(QUERIES.lg);
    const update = () => setBucket(getBucket());
    md.addEventListener("change", update);
    lg.addEventListener("change", update);
    return () => {
      md.removeEventListener("change", update);
      lg.removeEventListener("change", update);
    };
  }, []);

  return bucket;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = () => setMatches(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
