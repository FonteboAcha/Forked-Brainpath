import { useState, useEffect, useRef } from "react";
import { getConnectionHint } from "../lib/connection.js";

export function useConnectionQuality(setEffectiveType) {
  useEffect(() => {
    const conn =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    if (!conn) return;

    function handleChange() {
      setEffectiveType(conn.effectiveType);
    }

    conn.addEventListener("change", handleChange);
    return () => conn.removeEventListener("change", handleChange);
  }, [setEffectiveType]);
}

export function useDemoQualityOverride(setEffectiveType) {
  useEffect(() => {
    if (import.meta.env.VITE_DEMO_MODE !== "true") return;

    const levels = ["4g", "3g", "2g", "slow-2g"];
    let index = 0;

    function handleKey(e) {
      if (e.ctrlKey && e.shiftKey && e.key === "Q") {
        index = (index + 1) % levels.length;
        setEffectiveType(levels[index]);
        console.log(`Demo: switched to ${levels[index]}`);
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);
}