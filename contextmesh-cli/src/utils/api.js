import axios from "axios";

export const DEFAULT_BACKEND_URL = "http://localhost:8000";

export async function joinTeam(passcode, memberName, backendUrl = DEFAULT_BACKEND_URL) {
  try {
    const res = await axios.post(`${backendUrl}/auth/join-team`, {
      passcode,
      member_name: memberName,
    });
    return res.data; // expects { team_id, member, token }
  } catch (err) {
    if (err.response && err.response.data) {
      throw new Error(err.response.data.detail || "Authentication failed");
    }
    throw new Error(err.message);
  }
}
