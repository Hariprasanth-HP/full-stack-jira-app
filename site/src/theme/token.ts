// theme/tokens.ts
export type ThemeName = "light" | "dark" | "system";

export type ThemeTokens = {
  // HSL values as string without hsl() wrapper, e.g. "220 90% 56%"
  background?: string;
  foreground?: string;
  primary?: string;
  primaryForeground?: string;
  secondary?: string;
  secondaryForeground?: string;
  muted?: string;
  mutedForeground?: string;
  accent?: string;
  accentForeground?: string;
  border?: string;
  radius?: string; // e.g. "0.5rem"
  // add any tokens you want available globally
  [key: string]: string | undefined;
};

export const DEFAULT_LIGHT_TOKENS: ThemeTokens = {
  background: "0 0% 100%",
  foreground: "240 10% 3.9%",
  primary: "220 90% 56%",
  primaryForeground: "0 0% 100%",
  secondary: "240 4.8% 95.9%",
  secondaryForeground: "240 5.9% 10%",
  muted: "240 4.8% 95.9%",
  mutedForeground: "240 3.8% 46.1%",
  accent: "200 80% 50%",
  accentForeground: "0 0% 100%",
  border: "240 5.9% 90%",
  radius: "0.5rem",
};

export const DEFAULT_DARK_TOKENS: ThemeTokens = {
  background: "240 10% 3.9%",
  foreground: "0 0% 98%",
  primary: "220 90% 56%",
  primaryForeground: "0 0% 100%",
  secondary: "240 3.7% 15.9%",
  secondaryForeground: "0 0% 98%",
  muted: "240 3.7% 15.9%",
  mutedForeground: "240 5% 64.9%",
  accent: "200 80% 50%",
  accentForeground: "0 0% 98%",
  border: "240 3.7% 15.9%",
  radius: "0.5rem",
};
