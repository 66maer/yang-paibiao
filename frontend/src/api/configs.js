// 系统配置 API
import apiClient from "./client";

/**
 * 获取副本选项配置
 * @param {string} type - 可选，过滤副本类型（primary/secondary）
 */
export const getDungeonOptions = async (type = null) => {
  const params = type ? { type } : {};
  const response = await apiClient.get("/configs/dungeons", { params });
  return response; // 响应拦截器已经返回了 response.data
};

/**
 * 更新副本选项配置（管理员）
 * @param {Array} options - 副本选项列表
 */
export const updateDungeonOptions = async (options) => {
  const response = await apiClient.put("/admin/configs/dungeons", { options });
  return response; // 响应拦截器已经返回了 response.data
};
