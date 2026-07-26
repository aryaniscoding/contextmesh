import axios from "axios";
import { getDefaultBackendUrl } from "./config.js";

export async function joinTeam(passcode, memberName, backendUrl = getDefaultBackendUrl()) {
  try {
    const res = await axios.post(`${backendUrl}/auth/cli-join`, {
      passcode,
      member_name: memberName,
    });
    return res.data; // expects { team_id, team_name, member, role, token }
  } catch (err) {
    if (err.response && err.response.data) {
      throw new Error(err.response.data.detail || "Authentication failed");
    }
    throw new Error(err.message);
  }
}
