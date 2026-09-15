import { createContext, useContext, useLayoutEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('netatlas-theme') ?? 'dark');

  // useLayoutEffect (not useEffect) so the data-theme attribute — and the
  // CSS variables that depend on it — are committed before any descendant's
  // passive effect runs. NetworkGraph reads those variables via
  // getComputedStyle in its own effect; with a plain useEffect here, React's
  // child-before-parent effect order could run that read before this one,
  // painting the graph with the previous theme's colors.
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('netatlas-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
