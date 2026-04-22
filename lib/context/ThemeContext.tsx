"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // Read from what the inline script already set (avoids flash)
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");

    // Also watch for OS-level changes at runtime
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function onOsChange(e: MediaQueryListEvent) {
      if (!localStorage.getItem("theme")) {
        const next: Theme = e.matches ? "dark" : "light";
        setTheme(next);
        document.documentElement.classList.toggle("dark", e.matches);
      }
    }
    mq.addEventListener("change", onOsChange);
    return () => mq.removeEventListener("change", onOsChange);
  }, []);

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
