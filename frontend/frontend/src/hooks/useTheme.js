import { useTheme as useThemeContext } from '../context/ThemeContext';

/**
 * Custom hook for theme
 * Provides access to theme state and functions
 */
export const useTheme = () => {
  const theme = useThemeContext();
  return theme;
};

export default useTheme;