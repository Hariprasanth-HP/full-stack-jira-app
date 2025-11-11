// theme/ThemeProvider.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_DARK_TOKENS,
  DEFAULT_LIGHT_TOKENS,
  type ThemeName,
  type ThemeTokens,
} from "./token";

const STORAGE_KEY = "app-theme";
const TOKENS_KEY = "app-theme-tokens";

type ThemeContextType = {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  setTokens: (
    tokens: Partial<ThemeTokens>,
    options?: { persist?: boolean }
  ) => void;
  resetTokens: (options?: { persist?: boolean }) => void;
  tokens: ThemeTokens;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyTokensToRoot(tokens: ThemeTokens, isDark = false) {
  const root = document.documentElement;
  // write tokens as css variables
  for (const [k, v] of Object.entries(tokens)) {
    if (v == null) continue;
    const cssVarName = `--${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}`;
    root.style.setProperty(cssVarName, v);
  }

  // set or remove dark class for Tailwind dark mode if applicable
  if (isDark) root.classList.add("dark");
  else root.classList.remove("dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    return (stored as ThemeName) ?? "light";
  });

  const [tokens, setTokensState] = useState<ThemeTokens>(() => {
    if (typeof window === "undefined") return DEFAULT_LIGHT_TOKENS;
    const stored = localStorage.getItem(TOKENS_KEY);
    return stored ? JSON.parse(stored) : (DEFAULT_LIGHT_TOKENS as ThemeTokens);
  });

  // compute effective tokens: base + tokens override
  const effectiveTokens = useMemo(() => {
    return theme === "dark"
      ? { ...DEFAULT_DARK_TOKENS, ...tokens }
      : { ...DEFAULT_LIGHT_TOKENS, ...tokens };
  }, [theme, tokens]);

  // apply tokens to :root whenever tokens or theme changes
  useEffect(() => {
    const isDark = theme === "dark";
    applyTokensToRoot(effectiveTokens, isDark);
  }, [effectiveTokens, theme]);

  // public API
  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, t);
  };

  const setTokens = (
    partial: Partial<ThemeTokens>,
    options: { persist?: boolean } = { persist: true }
  ) => {
    setTokensState((prev) => {
      const next = { ...(prev ?? {}), ...partial };
      if (options.persist && typeof window !== "undefined")
        localStorage.setItem(TOKENS_KEY, JSON.stringify(next));
      applyTokensToRoot(
        theme === "dark"
          ? { ...DEFAULT_DARK_TOKENS, ...next }
          : { ...DEFAULT_LIGHT_TOKENS, ...next },
        theme === "dark"
      );
      return next;
    });
  };

  const resetTokens = (options: { persist?: boolean } = { persist: true }) => {
    const base = theme === "dark" ? DEFAULT_DARK_TOKENS : DEFAULT_LIGHT_TOKENS;
    setTokensState(base);
    if (options.persist && typeof window !== "undefined")
      localStorage.setItem(TOKENS_KEY, JSON.stringify(base));
    applyTokensToRoot(base, theme === "dark");
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      setTokens,
      resetTokens,
      tokens: effectiveTokens,
    }),
    [theme, effectiveTokens]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
