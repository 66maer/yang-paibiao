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
      user: null,
      isAuthenticated: false,

      // 设置认证信息
      setAuth: (token, user) =>
        set({
          token,
          user,
          isAuthenticated: true,
        }),

      // 清除认证信息
      clearAuth: () =>
        set({
          token: null,
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
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
