import axios from "axios";

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:9500/api/v2",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // 处理错误响应
    if (error.response) {
      const { status, data } = error.response;

      // 401 未授权，清除 token（但不自动跳转，让组件处理）
      if (status === 401) {
        localStorage.removeItem("access_token");
        // 只在非登录页面时才跳转
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/admin/login";
        }
      }

      // 返回错误信息
      const errorMessage = data?.detail || data?.message || "请求失败";
      return Promise.reject(errorMessage);
    }

    return Promise.reject(error.message || "网络错误");
  }
);

export default apiClient;
