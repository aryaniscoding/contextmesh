import axios from "axios";
import { getConfig } from "../utils/config.js";

// Reads the dynamically configured backend URL
export function getApi() {
  const config = getConfig();
  const baseURL = config ? config.backendUrl : "http://localhost:8000";
  const token = config ? config.token : "";

  return axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : ""
    },
  });
}
