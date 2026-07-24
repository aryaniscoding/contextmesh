import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, DollarSign, Cpu, TrendingUp, Users,
  BarChart3, Zap, Search, Brain,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { getTeamUsage } from "@/lib/api";

const COLORS = [
  "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#6366f1", "#14b8a6",
];

const ACTION_ICONS: Record<string, any> = {
  embedding: Zap,
  synthesis: Brain,
  search: Search,
  ai_usage: Cpu,
};

const UsageDashboard = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const teamRaw = localStorage.getItem("contextmesh_team");
  const team = teamRaw ? JSON.parse(teamRaw) : null;

  useEffect(() => {
    if (!team) {
      navigate("/teams");
      return;
    }
    const fetchUsage = async () => {
      const token = session?.access_token;
      if (!token) return;
      setLoading(true);
      getTeamUsage(token, team.teamId, days)
        .then(setData)
        .catch((e) => {
          console.error("Failed to load usage", e);
          setData(null);
        })
        .finally(() => setLoading(false));
    };
    fetchUsage();
  }, [days]);

  // Prepare chart data
  const barData = (data?.users || []).map((u: any, i: number) => ({
    name: u.display_name || "Unknown",
    cost: u.estimated_cost_usd,
    tokens: u.input_tokens + u.output_tokens,
    fill: COLORS[i % COLORS.length],
  }));

  // Aggregate by action for pie chart
  const actionMap: Record<string, number> = {};
  (data?.users || []).forEach((u: any) => {
    (u.breakdown || []).forEach((b: any) => {
      actionMap[b.action] = (actionMap[b.action] || 0) + b.count;
    });
  });
  const pieData = Object.entries(actionMap).map(([name, value], i) => ({
    name, value, fill: COLORS[i % COLORS.length],
  }));

  return (
    <div className="min-h-screen bg-[#04040f] text-foreground">
      {/* Header */}
      <header className="h-16 border-b border-[hsl(0_0%_100%/0.06)] bg-[hsl(240_10%_6%/0.8)] backdrop-blur-xl flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Button>
          <span className="text-[hsl(0_0%_100%/0.1)]">|</span>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-semibold text-foreground">Usage & Costs</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map((d) => (
            <Button
              key={d}
              variant={days === d ? "default" : "ghost"}
              size="sm"
              onClick={() => setDays(d)}
              className={`text-xs h-7 ${
                days === d
                  ? "bg-violet-500/20 text-violet-300 hover:bg-violet-500/30"
                  : "text-muted-foreground"
              }`}
            >
              {d}d
            </Button>
          ))}
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full"
              />
            </div>
          ) : !data ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Only team admins can view usage data.</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <SummaryCard
                  icon={DollarSign}
                  label="Total Cost"
                  value={`$${data.total_cost_usd.toFixed(4)}`}
                  color="text-emerald-400"
                  bg="bg-emerald-500/10"
                />
                <SummaryCard
                  icon={Cpu}
                  label="Total Tokens"
                  value={data.total_tokens.toLocaleString()}
                  color="text-violet-400"
                  bg="bg-violet-500/10"
                />
                <SummaryCard
                  icon={Users}
                  label="Active Users"
                  value={String(data.users.length)}
                  color="text-cyan-400"
                  bg="bg-cyan-500/10"
                />
                <SummaryCard
                  icon={TrendingUp}
                  label="Period"
                  value={`${data.period_days} days`}
                  color="text-amber-400"
                  bg="bg-amber-500/10"
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Cost per User Bar Chart */}
                <div className="lg:col-span-2 rounded-2xl border border-[hsl(0_0%_100%/0.06)] bg-[hsl(240_10%_6%/0.6)] p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-violet-400" />
                    Cost per Team Member
                  </h3>
                  {barData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.05)" />
                        <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 11 }} />
                        <YAxis tick={{ fill: "#71717a", fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(240 10% 8%)",
                            border: "1px solid hsl(0 0% 100% / 0.1)",
                            borderRadius: "12px",
                            fontSize: "12px",
                          }}
                          formatter={(value: number) => [`$${value.toFixed(6)}`, "Cost"]}
                        />
                        <Bar dataKey="cost" radius={[8, 8, 0, 0]}>
                          {barData.map((entry: any, i: number) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground/50 italic text-center py-16">No usage data yet.</p>
                  )}
                </div>

                {/* Action Type Pie */}
                <div className="rounded-2xl border border-[hsl(0_0%_100%/0.06)] bg-[hsl(240_10%_6%/0.6)] p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-cyan-400" />
                    Usage by Action
                  </h3>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "hsl(240 10% 8%)",
                            border: "1px solid hsl(0 0% 100% / 0.1)",
                            borderRadius: "12px",
                            fontSize: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground/50 italic text-center py-16">No data.</p>
                  )}
                  <div className="space-y-2 mt-2">
                    {pieData.map((d, i) => {
                      const Icon = ACTION_ICONS[d.name] || Cpu;
                      return (
                        <div key={d.name} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <div className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                            <Icon className="h-3 w-3" />
                            {d.name}
                          </span>
                          <span className="text-foreground font-mono">{d.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Per User Breakdown */}
              <div className="rounded-2xl border border-[hsl(0_0%_100%/0.06)] bg-[hsl(240_10%_6%/0.6)] overflow-hidden">
                <div className="p-6 border-b border-[hsl(0_0%_100%/0.06)]">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Users className="h-4 w-4 text-violet-400" />
                    Per-User Breakdown
                  </h3>
                </div>

                {(data.users || []).length === 0 ? (
                  <p className="py-12 text-center text-muted-foreground/50 italic text-sm">
                    No usage recorded in this period.
                  </p>
                ) : (
                  <div className="divide-y divide-[hsl(0_0%_100%/0.04)]">
                    {(data.users || []).map((u: any, i: number) => {
                      // Only show ai_usage rows in the model breakdown
                      const aiRows = (u.breakdown || []).filter((b: any) => b.action === "ai_usage");
                      return (
                        <div key={u.user_id} className="p-5">
                          {/* User header row */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{ background: `${COLORS[i % COLORS.length]}25`, color: COLORS[i % COLORS.length] }}
                              >
                                {(u.display_name || "?").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground">{u.display_name}</p>
                                <p className="text-[11px] text-muted-foreground/50">{u.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6 text-right">
                              <div>
                                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-0.5">Requests</p>
                                <p className="text-sm font-mono text-foreground">{u.total_requests}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-0.5">Tokens</p>
                                <p className="text-sm font-mono text-foreground">{(u.input_tokens + u.output_tokens).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-0.5">Est. Cost</p>
                                <p className="text-sm font-mono font-semibold text-emerald-400">${u.estimated_cost_usd.toFixed(4)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Per-model breakdown */}
                          {aiRows.length > 0 && (
                            <div className="ml-11 space-y-1.5">
                              {aiRows.map((b: any, j: number) => (
                                <div
                                  key={j}
                                  className="flex items-center justify-between rounded-lg px-3 py-2 bg-[hsl(0_0%_100%/0.025)]"
                                >
                                  <div className="flex items-center gap-2">
                                    <Cpu className="h-3 w-3 text-muted-foreground/40" />
                                    <span className="text-xs font-mono text-muted-foreground">{b.model}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[hsl(0_0%_100%/0.05)] text-muted-foreground/50">
                                      {b.count} session{b.count !== 1 ? "s" : ""}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs font-mono">
                                    <span className="text-muted-foreground/60">{b.tokens.toLocaleString()} tok</span>
                                    <span className="text-emerald-400/80">${b.cost.toFixed(4)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

function SummaryCard({ icon: Icon, label, value, color, bg }: {
  icon: any; label: string; value: string; color: string; bg: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[hsl(0_0%_100%/0.06)] bg-[hsl(240_10%_6%/0.6)] p-5"
    >
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </motion.div>
  );
}

export default UsageDashboard;
