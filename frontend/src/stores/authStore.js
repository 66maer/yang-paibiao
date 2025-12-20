import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * 认证状态管理
 *
 * user 结构示例：
 * {
 *   id: 1,
 *   username: 'user123',
 *   nickname: '小明',
 *   other_nicknames: ['昵称1', '昵称2'],
 *   avatar: '',
 *   role: 'user',  // 'admin' | 'user'
 *   current_guild_id: 5,
 *   guilds: [
 *     {
 *       id: 5,
 *       name: '荻花宫金团',
 *       guild_nickname: '奶妈小明',
 *       role: 'owner'  // 'owner' | 'helper' | 'member'
 *     },
 *     ...
 *   ]
 * }
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
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

      // 切换当前群组
      setCurrentGuild: (guildId) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              current_guild_id: guildId,
            },
          });
        }
      },

      // 更新用户昵称
      updateUserNickname: (nickname) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              nickname,
            },
          });
        }
      },

      // 更新其他昵称列表
      updateOtherNicknames: (otherNicknames) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              other_nicknames: otherNicknames,
            },
          });
        }
      },

      // 更新群昵称
      updateGuildNickname: (guildId, guildNickname) => {
        const { user } = get();
        if (user && user.guilds) {
          const updatedGuilds = user.guilds.map((guild) =>
            guild.id === guildId
              ? { ...guild, guild_nickname: guildNickname }
              : guild
          );
          set({
            user: {
              ...user,
              guilds: updatedGuilds,
            },
          });
        }
      },

      // 更新用户头像
      updateUserAvatar: (avatar) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              avatar,
            },
          });
        }
      },

      // 更新用户的群组列表
      updateUserGuilds: (guilds) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              guilds,
            },
          });
        }
      },
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
