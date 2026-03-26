/**
 * ContextMesh API — Frontend → Backend connection layer.
 *
 * Replace localStorage calls with these real API calls once the
 * backend is deployed and running.
 *
 * Usage:
 *   import { createTeam, joinTeam, getMasterContext } from '@/lib/api';
 */

// Change this when deploying the backend to production
export const API_BASE = import.meta.env.VITE_CONTEXTMESH_API || "http://localhost:8000";

// ─── Auth ───

export async function createTeam(teamName: string, adminName: string) {
  const res = await fetch(`${API_BASE}/auth/create-team`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ team_name: teamName, admin_name: adminName }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to create team");
  }
  return res.json(); // { team_id, passcode, message }
}

export async function joinTeam(passcode: string, memberName: string) {
  const res = await fetch(`${API_BASE}/auth/join-team`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passcode, member_name: memberName }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Invalid passcode");
  }
  return res.json(); // { team_id, team_name, member, all_members }
}

// ─── Context ───

export async function saveContext(
  teamId: string,
  memberName: string,
  messages: Array<{ role: string; content: string }>,
  filesModified: string[] = [],
  isPrivate = false
) {
  const res = await fetch(`${API_BASE}/context/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      team_id: teamId,
      member_name: memberName,
      messages,
      files_modified: filesModified,
      is_private: isPrivate,
    }),
  });
  if (!res.ok) throw new Error("Failed to save context");
  return res.json(); // { session_id, saved }
}

export async function getMemberContext(teamId: string, memberName: string) {
  const res = await fetch(
    `${API_BASE}/context/member?team_id=${teamId}&member=${encodeURIComponent(memberName)}`
  );
  if (!res.ok) throw new Error("Failed to fetch member context");
  return res.json(); // { member, sessions }
}

export async function markSessionPrivate(sessionId: number, isPrivate = true) {
  const res = await fetch(`${API_BASE}/context/session/${sessionId}/private`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_private: isPrivate }),
  });
  if (!res.ok) throw new Error("Failed to update session privacy");
  return res.json(); // { session_id, is_private, updated }
}

// ─── Master Context ───

export async function getMasterContext(teamId: string) {
  const res = await fetch(`${API_BASE}/master-context?team_id=${teamId}`);
  if (!res.ok) throw new Error("Failed to fetch master context");
  return res.json(); // { version, decisions, in_progress, open_questions, conflicts }
}

export async function getAllTeamContext(teamId: string) {
  const res = await fetch(`${API_BASE}/context/all?team_id=${teamId}`);
  if (!res.ok) throw new Error("Failed to fetch team context");
  return res.json(); // { team_id, sessions: [...] }
}
