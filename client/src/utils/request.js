import axios from "axios";
import { getLocalToken } from "./token";
import { store } from "@/store";

const request = axios.create({
  baseURL: process.env.SERVER_URL || "http://localhost:5000/api",
  timeout: 5000,
});

request.interceptors.request.use(
  (config) => {
    const token = getLocalToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    const curLeague = store.getState().league.curLeague;
    if (curLeague) {
      config.headers["curLeague"] = curLeague;
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
