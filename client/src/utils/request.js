import axios from "axios";
import { getLocalToken } from "./token";

const request = axios.create({
  // baseURL: "http://api.zyhm.fun/api",
  baseURL: "http://localhost:8080/api/v1",
  timeout: 5000,
});

request.interceptors.request.use(
  (config) => {
    const token = getLocalToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么
    return response.data;
  },
  (error) => {
    // 对响应错误做点什么
    return Promise.reject(error);
  }
);

export { request };
