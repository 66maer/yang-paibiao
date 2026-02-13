import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:9500/api/v2";

export async function publishCard(data) {
  const response = await axios.post(`${baseURL}/game/publish-card`, data);
  return response.data;
}
