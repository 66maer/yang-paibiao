import { useThemeContext } from "@/contexts/ThemeContext";

/**
 * 主题 Hook - 使用全局 ThemeContext
 * @returns {Object} 主题状态和操作方法
 */
export const useTheme = () => {
  return useThemeContext();
};
