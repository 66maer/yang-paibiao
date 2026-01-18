import axios from "axios";
import useAuthStore from "@/stores/authStore";

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:9500/api/v2",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 刷新token的Promise（避免并发刷新）
let refreshTokenPromise = null;

// 解码JWT获取过期时间
const decodeToken = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

// 检查token是否即将过期（5分钟内）
const isTokenExpiringSoon = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  const expiryTime = decoded.exp * 1000; // 转换为毫秒
  const now = Date.now();
  const timeUntilExpiry = expiryTime - now;

  // 小于5分钟则需要刷新
  return timeUntilExpiry < 5 * 60 * 1000;
};

// 刷新token
const refreshAccessToken = async () => {
  const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  try {
    // 使用新的axios实例避免拦截器循环
    const response = await axios.post(
      `${apiClient.defaults.baseURL}/auth/refresh`,
      { refresh_token: refreshToken },
      { headers: { "Content-Type": "application/json" } },
    );

    const { access_token, refresh_token } = response.data.data;

    // 解码新token获取过期时间
    const decoded = decodeToken(access_token);
    const tokenExpiry = decoded?.exp ? decoded.exp * 1000 : null;

    // 更新store
    setTokens(access_token, refresh_token, tokenExpiry);

    return access_token;
  } catch (error) {
    // 刷新失败，清除认证信息
    clearAuth();
    throw error;
  }
};

// 请求拦截器
apiClient.interceptors.request.use(
  async (config) => {
    // 跳过刷新token的请求
    if (config.url?.includes("/auth/refresh")) {
      return config;
    }

    const { token } = useAuthStore.getState();

    if (token) {
      // 检查token是否即将过期
      if (isTokenExpiringSoon(token)) {
        try {
          // 如果已经有刷新请求在进行中，等待它完成
          if (!refreshTokenPromise) {
            refreshTokenPromise = refreshAccessToken().finally(() => {
              refreshTokenPromise = null;
            });
          }

          const newToken = await refreshTokenPromise;
          config.headers.Authorization = `Bearer ${newToken}`;
        } catch (error) {
          // 刷新失败，使用旧token继续请求（让响应拦截器处理401）
          config.headers.Authorization = `Bearer ${token}`;
        }
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // 添加当前群组ID到请求头
    const { user } = useAuthStore.getState();
    if (user?.current_guild_id) {
      config.headers["X-Guild-Id"] = user.current_guild_id;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // 处理错误响应
    if (error.response) {
      const { status, data } = error.response;

      // 401 未授权，尝试刷新token
      // 排除登录和注册接口，这些接口的401不应触发token刷新
      const isAuthEndpoint =
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/register") ||
        originalRequest.url?.includes("/admin/auth/login");

      if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
        originalRequest._retry = true;

        try {
          // 尝试刷新token
          if (!refreshTokenPromise) {
            refreshTokenPromise = refreshAccessToken().finally(() => {
              refreshTokenPromise = null;
            });
          }

          const newToken = await refreshTokenPromise;

          // 重试原请求
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // 刷新失败，跳转登录页
          const { clearAuth } = useAuthStore.getState();
          clearAuth();

          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/admin/login";
          }

          return Promise.reject(refreshError);
        }
      }

      // 返回错误信息
      const errorMessage = data?.detail || data?.message || "请求失败";
      return Promise.reject(errorMessage);
    }

    return Promise.reject(error.message || "网络错误");
  },
);

export default apiClient;
