"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { formatEther, type Address } from "viem";
import { useReadContract } from "wagmi";
import { CONTRACTS, AGENT_REGISTRY_ABI } from "@/lib/contracts";

export default function AgentProfilePage() {
  const params = useParams();
  const agentAddress = params.address as Address;

  const { data: agent, isLoading } = useReadContract({
    address: CONTRACTS.agentRegistry,
    abi: AGENT_REGISTRY_ABI,
    functionName: "getAgent",
    args: [agentAddress],
  });

  if (isLoading || !agent) {
    return (
      <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
        Loading agent profile from chain...
      </div>
    );
  }

  const totalBets = Number(agent.totalBets);
  const wins = Number(agent.wins);
  const losses = Number(agent.losses);
  const winRate = totalBets > 0 ? ((wins / totalBets) * 100).toFixed(1) : "0.0";
  const netProfit = BigInt(agent.totalProfit) - BigInt(agent.totalLoss);
  const isProfitable = netProfit > 0n;

  const cardStyle = {
    background: "var(--midnight)",
    border: "1px solid rgba(0,245,255,0.15)",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "20px",
  };

  return (
    <div style={{ maxWidth: "1200px" }}>
      {/* Back link */}
      <Link
        href="/agents"
        className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--electric-cyan)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-muted)"; }}
      >
        ← Back to Agents
      </Link>

      {/* Header */}
      <div
        style={{ ...cardStyle, border: "2px solid rgba(0,245,255,0.2)", position: "relative", overflow: "hidden" }}
      >
        {/* top gradient bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "4px",
          background: "linear-gradient(90deg, var(--electric-cyan), var(--neon-pink))",
        }} />

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1
              className="text-3xl font-bold uppercase tracking-widest"
              style={{ fontFamily: "var(--font-rajdhani)" }}
            >
              <span className="text-gradient-cyan-pink">{agent.name || "Unnamed Agent"}</span>
            </h1>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)", fontFamily: "var(--font-ibm-plex-mono)" }}>
              {agentAddress}
            </p>
          </div>
          <span
            className="text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider"
            style={{
              color: agent.isActive ? "var(--neon-green)" : "var(--hot-pink)",
              background: agent.isActive ? "rgba(0,255,136,0.1)" : "rgba(255,51,102,0.1)",
              border: `1px solid ${agent.isActive ? "rgba(0,255,136,0.4)" : "rgba(255,51,102,0.4)"}`,
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full mr-1 animate-blink"
              style={{ background: agent.isActive ? "var(--neon-green)" : "var(--hot-pink)" }}
            />
            {agent.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          {agent.strategy || "No strategy set"}
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        {[
          { label: "Score", value: String(Number(agent.score)), color: "var(--electric-cyan)" },
          { label: "Win Rate", value: `${winRate}%`, color: "var(--neon-green)" },
          { label: "Total Bets", value: String(totalBets), color: "var(--text-primary)" },
          {
            label: "Net P&L",
            value: `${isProfitable ? "+" : netProfit < 0n ? "-" : ""}${formatEther(netProfit > 0n ? netProfit : -netProfit)} ETH`,
            color: isProfitable ? "var(--neon-green)" : netProfit < 0n ? "var(--hot-pink)" : "var(--text-muted)",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-4 text-center transition-all duration-200 hover:-translate-y-1"
            style={{
              background: "var(--card-bg)",
              border: "1px solid rgba(0,245,255,0.12)",
            }}
          >
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
            <p
              className="text-2xl font-bold"
              style={{ color: stat.color, fontFamily: "var(--font-rajdhani)" }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Performance Details */}
      <div style={cardStyle}>
        <h2
          className="text-lg font-bold mb-4 uppercase tracking-wider"
          style={{ fontFamily: "var(--font-rajdhani)", color: "var(--electric-cyan)" }}
        >
          Performance Details
        </h2>
        <div className="space-y-3 text-sm">
          {[
            { label: "Wins", value: String(wins), color: "var(--neon-green)" },
            { label: "Losses", value: String(losses), color: "var(--hot-pink)" },
            { label: "Total Profit", value: `${formatEther(BigInt(agent.totalProfit))} ETH`, color: "var(--neon-green)" },
            { label: "Total Loss", value: `${formatEther(BigInt(agent.totalLoss))} ETH`, color: "var(--hot-pink)" },
            { label: "Staked Amount", value: `${formatEther(BigInt(agent.stakedAmount))} ETH`, color: "var(--electric-cyan)" },
            { label: "Markets Created", value: String(Number(agent.marketsCreated)), color: "var(--text-primary)" },
          ].map((row) => (
            <div
              key={row.label}
              className="flex justify-between py-2"
              style={{ borderBottom: "1px solid rgba(0,245,255,0.06)" }}
            >
              <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
              <span className="font-bold" style={{ color: row.color, fontFamily: "var(--font-rajdhani)" }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Win/Loss Bar */}
      {totalBets > 0 && (
        <div style={cardStyle}>
          <h2
            className="text-lg font-bold mb-4 uppercase tracking-wider"
            style={{ fontFamily: "var(--font-rajdhani)", color: "var(--electric-cyan)" }}
          >
            Win / Loss Distribution
          </h2>
          <div className="w-full h-5 rounded-full overflow-hidden" style={{ background: "rgba(255,51,102,0.2)" }}>
            <div
              className="h-full rounded-l-full transition-all"
              style={{
                width: `${parseFloat(winRate)}%`,
                background: "var(--neon-green)",
                boxShadow: "0 0 10px rgba(0,255,136,0.6)",
              }}
            />
          </div>
          <div className="flex justify-between mt-3 text-sm">
            <span className="font-bold" style={{ color: "var(--neon-green)", fontFamily: "var(--font-rajdhani)" }}>
              {wins} Wins ({winRate}%)
            </span>
            <span className="font-bold" style={{ color: "var(--hot-pink)", fontFamily: "var(--font-rajdhani)" }}>
              {losses} Losses ({(100 - parseFloat(winRate)).toFixed(1)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
