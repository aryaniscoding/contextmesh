export type EntryCategory = "decision" | "task" | "question" | "conflict" | "handoff" | "chat";

export interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

export interface ContextEntry {
  category: EntryCategory;
  title: string;
  body: string;
  files?: string[];
  time: string;
  progress?: number;
  chatMessages?: ChatMessage[];
  chatMeta?: string;
}

export interface TeamMember {
  name: string;
  task: string;
  status: "active" | "away" | "new";
  initials: string;
  gradient: string;
}

export const categoryConfig: Record<EntryCategory, { label: string; color: string; bg: string }> = {
  decision: { label: "Decision", color: "hsl(239 84% 67%)", bg: "hsl(239 84% 67% / 0.15)" },
  task: { label: "Task Complete", color: "hsl(142 70% 45%)", bg: "hsl(142 70% 45% / 0.15)" },
  question: { label: "Open Question", color: "hsl(45 80% 55%)", bg: "hsl(45 80% 55% / 0.15)" },
  conflict: { label: "Conflict", color: "hsl(0 84% 60%)", bg: "hsl(0 84% 60% / 0.15)" },
  handoff: { label: "Handoff", color: "hsl(263 70% 60%)", bg: "hsl(263 70% 60% / 0.15)" },
  chat: { label: "💬 Raw Chat", color: "hsl(0 0% 60%)", bg: "hsl(0 0% 60% / 0.15)" },
};

export const members: TeamMember[] = [
  { name: "Arjun Sharma", task: "Auth Module", status: "active", initials: "AS", gradient: "linear-gradient(135deg, hsl(239 84% 67%), hsl(263 70% 60%))" },
  { name: "Priya Mehta", task: "API Gateway", status: "active", initials: "PM", gradient: "linear-gradient(135deg, hsl(263 70% 60%), hsl(271 81% 56%))" },
  { name: "Rahul Dev", task: "Away · 2h", status: "away", initials: "RD", gradient: "linear-gradient(135deg, hsl(45 80% 55%), hsl(39 90% 50%))" },
  { name: "Sneha Rao", task: "New · Onboarding", status: "new", initials: "SR", gradient: "linear-gradient(135deg, hsl(187 94% 43%), hsl(199 89% 48%))" },
];

export const memberEntries: Record<string, ContextEntry[]> = {
  "Arjun Sharma": [
    {
      category: "chat",
      title: "AI Chat — Auth refactor session",
      body: "47 messages · 1.2k tokens · OAuth2 discussion",
      files: ["auth/middleware.ts"],
      time: "1h ago",
      chatMeta: "47 messages · 1.2k tokens",
      chatMessages: [
        { role: "user", text: "should i use JWT or OAuth2 for mobile?" },
        { role: "ai", text: "For mobile clients, OAuth2 with PKCE is recommended because..." },
        { role: "user", text: "what about refresh token expiry?" },
        { role: "ai", text: "Set to 30 days based on your user retention data..." },
      ],
    },
    { category: "decision", title: "JWT → OAuth2 Migration", body: "Switched to PKCE flow for mobile clients after security review. Rate limiting via Redis.", files: ["auth/middleware.ts", "config/oauth.ts"], time: "14m ago" },
    { category: "task", title: "Auth middleware refactor done", body: "Completed token refresh logic. 3 edge cases handled. Tests passing.", files: ["auth/refresh.ts"], time: "1h ago" },
    { category: "question", title: "Rate limiting strategy", body: "Should we rate-limit per user or per IP? Needs team decision before deploy.", time: "2h ago" },
    { category: "decision", title: "Session expiry: 7 days", body: "Extended from 24h based on user feedback. Refresh tokens persist 30 days.", time: "3h ago" },
  ],
  "Priya Mehta": [
    {
      category: "chat",
      title: "Gateway routing session",
      body: "32 messages · 890 tokens · Routing architecture",
      files: ["gateway/router.ts"],
      time: "45m ago",
      chatMeta: "32 messages · 890 tokens",
      chatMessages: [
        { role: "user", text: "best pattern for API gateway routing?" },
        { role: "ai", text: "Given your microservices setup, I'd recommend..." },
        { role: "user", text: "what about versioning?" },
        { role: "ai", text: "Use URL path versioning /v1/, /v2/ for..." },
      ],
    },
    { category: "task", title: "API Gateway v2 live", body: "Migrated all routes to new gateway. Zero downtime deploy. Latency improved 40ms avg.", files: ["gateway/router.ts"], time: "30m ago" },
    { category: "decision", title: "Rate limit: 1000 req/min per tenant", body: "Set after load testing. Enterprise tier gets 5000. Config in gateway/limits.ts", time: "1h ago" },
    { category: "question", title: "Webhook retry logic", body: "Current max 3 retries — should this be configurable per client? Flagged for Arjun.", time: "2h ago" },
  ],
  "Rahul Dev": [
    { category: "handoff", title: "Context snapshot generated", body: "Full handoff to Sneha initiated. 12 decisions logged, 3 open questions transferred.", time: "2h ago" },
    { category: "decision", title: "Database: PostgreSQL + Redis cache", body: "Chose PG for persistence, Redis for session cache and rate limiting. Infra ready.", time: "1d ago" },
  ],
  "Sneha Rao": [
    { category: "handoff", title: "Onboarding from Rahul's context", body: "Loading 12 decisions, 47 context entries from Rahul. AI initialized with full context.", time: "just now", progress: 82 },
    { category: "question", title: "Understanding webhook retry", body: "Inherited from Rahul — needs resolution with Priya re: configurable retry logic.", time: "5m ago" },
  ],
};

export const masterContext = {
  decisions: [
    "OAuth2 PKCE for mobile auth",
    "Redis rate limiting: 1000/min",
    "Session expiry: 7 days",
    "PostgreSQL + Redis cache",
    "API Gateway v2 architecture",
    "Zero downtime deploy strategy",
    "MCP server plugin interface",
  ],
  questions: [
    { text: "Rate limiting strategy", owner: "Arjun" },
    { text: "Webhook retry config", owner: "Priya → Sneha" },
    { text: "Mobile SDK scope", owner: "unassigned" },
  ],
  handoffs: [{ from: "Rahul", to: "Sneha", time: "2h ago" }],
  conflict: {
    text: "Auth rate limit: Arjun says per-IP, Priya's gateway config says per-tenant",
  },
};

export const handoffDoc = `═══ HANDOFF SNAPSHOT ═══
Member: Rahul Dev → Sneha Rao
Generated: ${new Date().toISOString().split("T")[0]}

DECISIONS MADE (4):
✓ Database: PostgreSQL + Redis
✓ Session expiry: 7 days
✓ OAuth2 PKCE flow
✓ Rate limit: 1000 req/min

OPEN QUESTIONS (2):
? Webhook retry logic
? Mobile SDK scope

FILES OWNED:
· db/schema.ts
· infra/docker-compose.yml
· config/redis.ts
═══════════════════════`;
