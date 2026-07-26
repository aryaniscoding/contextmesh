import axios from "axios";
import { getConfig, getBackendUrl } from "../utils/config.js";

// Default API client — 15s timeout for most calls
export function getApi() {
  const config = getConfig();
  const baseURL = getBackendUrl();
  const token = config ? config.token : "";

  return axios.create({
    baseURL,
    timeout: 15000,
    headers: {
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : ""
    },
  });
}

// Long-timeout client for save_context — embedding + synthesis can take 30-60s
export function getLongApi() {
  const config = getConfig();
  const baseURL = getBackendUrl();
  const token = config ? config.token : "";

  return axios.create({
    baseURL,
    timeout: 60000,
    headers: {
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : ""
    },
  });
}
