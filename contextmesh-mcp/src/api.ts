/**
 * Shared API helper — calls the ContextMesh backend.
 */
import axios, { AxiosInstance } from "axios";

const BACKEND_URL = process.env.CONTEXTMESH_API || "http://localhost:8000";

export const api: AxiosInstance = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

/** Configuration from environment variables. */
export const config = {
  teamId: process.env.TEAM_ID || "",
  memberName: process.env.MEMBER_NAME || "",
  masterContextEnabled: process.env.MASTER_CONTEXT_ENABLED !== "false",
};
