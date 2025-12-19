import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * 认证状态管理
 */
const useAuthStore = create(
  persist(
    (set) => ({
      // 状态
      token: null,
      refreshToken: null,
      tokenExpiry: null,
      user: null,
      isAuthenticated: false,

      // 设置认证信息
      setAuth: (token, refreshToken, user, tokenExpiry = null) =>
        set({
          token,
          refreshToken,
          tokenExpiry,
          user,
          isAuthenticated: true,
        }),

      // 更新token（用于刷新后）
      setTokens: (token, refreshToken, tokenExpiry = null) =>
        set({
          token,
          refreshToken,
          tokenExpiry,
        }),

      // 清除认证信息
      clearAuth: () =>
        set({
          token: null,
          refreshToken: null,
          tokenExpiry: null,
          user: null,
          isAuthenticated: false,
        }),

      // 更新用户信息
      setUser: (user) => set({ user }),
    }),
    {
      name: "auth-storage", // localStorage key
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        tokenExpiry: state.tokenExpiry,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
