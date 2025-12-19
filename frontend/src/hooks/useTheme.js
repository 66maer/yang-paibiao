import { useEffect, useMemo, useState } from "react";

const THEME_KEY = "theme";
const THEME_LIGHT = "light";
const THEME_DARK = "dark";

export const useTheme = (defaultTheme = THEME_LIGHT) => {
  const [theme, setThemeState] = useState(() => {
    // 从 localStorage 读取主题
    const stored = localStorage.getItem(THEME_KEY);
    const initialTheme = stored || defaultTheme;

    // 立即应用主题到 DOM
    document.documentElement.classList.remove(THEME_LIGHT, THEME_DARK);
    document.documentElement.classList.add(initialTheme);

    return initialTheme;
  });

  const isDark = useMemo(() => theme === THEME_DARK, [theme]);
  const isLight = useMemo(() => theme === THEME_LIGHT, [theme]);

  const _setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    document.documentElement.classList.remove(THEME_LIGHT, THEME_DARK);
    document.documentElement.classList.add(newTheme);
  };

  const setLightTheme = () => _setTheme(THEME_LIGHT);
  const setDarkTheme = () => _setTheme(THEME_DARK);
  const toggleTheme = () => (theme === THEME_DARK ? setLightTheme() : setDarkTheme());

  return { theme, isDark, isLight, setLightTheme, setDarkTheme, toggleTheme };
};
