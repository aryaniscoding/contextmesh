/**
 * ContextMesh API — Frontend → Backend connection layer (v2).
 * All API calls include JWT Authorization header from Supabase Auth.
 */

export const API_BASE = import.meta.env.VITE_CONTEXTMESH_API || "http://localhost:8000";

// ─── Helper ───

function authHeaders(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Auth ───

export async function getMe(token: string) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function getMyTeams(token: string) {
  const res = await fetch(`${API_BASE}/auth/my-teams`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function createTeam(token: string, teamName: string) {
  const res = await fetch(`${API_BASE}/auth/create-team`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ team_name: teamName }),
  });
  return handleResponse(res);
}

export async function getTeamPasscode(token: string, teamId: string) {
  const res = await fetch(
    `${API_BASE}/auth/team-passcode?team_id=${encodeURIComponent(teamId)}`,
    { headers: authHeaders(token) }
  );
  return handleResponse(res);
}

export async function joinTeam(token: string, passcode: string) {
  const res = await fetch(`${API_BASE}/auth/join-team`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ passcode }),
  });
  return handleResponse(res);
}

export async function getTeamInfo(token: string, teamId: string) {
  const res = await fetch(
    `${API_BASE}/auth/team-info?team_id=${encodeURIComponent(teamId)}`,
    { headers: authHeaders(token) }
  );
  return handleResponse(res);
}

export async function promoteMember(
  token: string,
  teamId: string,
  targetUserId: string,
  role: string
) {
  const res = await fetch(
    `${API_BASE}/auth/promote-member?team_id=${encodeURIComponent(teamId)}`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ target_user_id: targetUserId, role }),
    }
  );
  return handleResponse(res);
}

// ─── Context ───

export async function saveContext(
  token: string,
  teamId: string,
  messages: Array<{ role: string; content: string }>,
  filesModified: string[] = [],
  isPrivate = false
) {
  const res = await fetch(`${API_BASE}/context/save`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      team_id: teamId,
      messages,
      files_modified: filesModified,
      is_private: isPrivate,
    }),
  });
  return handleResponse(res);
}

export async function getMemberContext(
  token: string,
  teamId: string,
  memberUserId?: string,
  memberName?: string
) {
  const params = new URLSearchParams({ team_id: teamId });
  if (memberUserId) params.set("member_user_id", memberUserId);
  if (memberName) params.set("member", memberName);

  const res = await fetch(`${API_BASE}/context/member?${params}`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function markSessionPrivate(token: string, sessionId: number, isPrivate = true) {
  const res = await fetch(`${API_BASE}/context/session/${sessionId}/private`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ is_private: isPrivate }),
  });
  return handleResponse(res);
}

export async function getAllTeamContext(token: string, teamId: string) {
  const res = await fetch(`${API_BASE}/context/all?team_id=${encodeURIComponent(teamId)}`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

// ─── Semantic Search ───

export async function searchContext(token: string, teamId: string, query: string, limit = 10) {
  const res = await fetch(`${API_BASE}/context/search`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ team_id: teamId, query, limit }),
  });
  return handleResponse(res);
}

// ─── Master Context ───

export async function getMasterContext(token: string, teamId: string) {
  const res = await fetch(
    `${API_BASE}/master-context?team_id=${encodeURIComponent(teamId)}`,
    { headers: authHeaders(token) }
  );
  return handleResponse(res);
}

// ─── Usage & Costs ───

export async function getTeamUsage(token: string, teamId: string, days = 30) {
  const res = await fetch(
    `${API_BASE}/usage/team?team_id=${encodeURIComponent(teamId)}&days=${days}`,
    { headers: authHeaders(token) }
  );
  return handleResponse(res);
}

export async function getHandoffSnapshot(
  token: string,
  teamId: string,
  memberUserId?: string,
  memberName?: string,
) {
  const params = new URLSearchParams({ team_id: teamId });
  if (memberUserId) params.set("member_user_id", memberUserId);
  if (memberName) params.set("member_name", memberName);
  const res = await fetch(`${API_BASE}/context/handoff?${params}`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

export async function getMyUsage(token: string, teamId: string, days = 30) {
  const res = await fetch(
    `${API_BASE}/usage/me?team_id=${encodeURIComponent(teamId)}&days=${days}`,
    { headers: authHeaders(token) }
  );
  return handleResponse(res);
}
