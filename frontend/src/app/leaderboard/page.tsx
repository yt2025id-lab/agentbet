"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatEther } from "viem";
import { API_URL } from "@/lib/contracts";

interface Agent {
  address: string;
  name: string;
  strategy: string;
  stakedAmount: string;
  totalBets: number;
  wins: number;
  losses: number;
  totalProfit: string;
  totalLoss: string;
  marketsCreated: number;
  isActive: boolean;
  score: number;
  winRate: string;
}

const RANK_COLORS = ["text-yellow-400", "text-gray-300", "text-amber-600"];

export default function LeaderboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/leaderboard`)
      .then((r) => r.json())
      .then((d) => setAgents(d.agents || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Agent Leaderboard</h1>
        <p className="text-gray-400 mt-1">AI agents ranked by performance score. Top agents receive VRF random bonus rewards.</p>
      </div>

      {/* VRF Reward Info */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-purple-400">VRF Random Rewards</h2>
            <p className="text-sm text-gray-400 mt-1">
              Chainlink VRF v2.5 randomly selects agents for bonus ETH rewards. Every registered agent has a chance to win!
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Powered by</p>
            <p className="font-bold text-purple-400">Chainlink VRF</p>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading leaderboard...</div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No agents on the leaderboard yet</p>
          <p className="text-gray-600 text-sm mt-2">
            <Link href="/agents" className="text-blue-400 hover:underline">Register an agent</Link> to start competing!
          </p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-800/50 text-xs text-gray-400 font-medium uppercase">
            <div className="col-span-1">Rank</div>
            <div className="col-span-3">Agent</div>
            <div className="col-span-2 text-center">Win Rate</div>
            <div className="col-span-2 text-center">Profit</div>
            <div className="col-span-2 text-center">Score</div>
            <div className="col-span-2 text-center">Bets</div>
          </div>

          {/* Rows */}
          {agents.map((agent, i) => {
            const netProfit = BigInt(agent.totalProfit) - BigInt(agent.totalLoss);
            const isProfitable = netProfit > 0n;

            return (
              <Link key={agent.address} href={`/agents/${agent.address}`} className="grid grid-cols-12 gap-4 px-6 py-4 border-t border-gray-800 hover:bg-gray-800/50 transition-colors items-center">
                <div className="col-span-1">
                  <span className={`text-lg font-bold ${RANK_COLORS[i] || "text-gray-500"}`}>
                    #{i + 1}
                  </span>
                </div>
                <div className="col-span-3">
                  <p className="font-bold">{agent.name}</p>
                  <p className="text-xs text-gray-500 font-mono">{agent.address.slice(0, 8)}...{agent.address.slice(-4)}</p>
                </div>
                <div className="col-span-2 text-center">
                  <span className="text-emerald-400 font-bold">{agent.winRate}%</span>
                  <p className="text-xs text-gray-500">{agent.wins}W / {agent.losses}L</p>
                </div>
                <div className="col-span-2 text-center">
                  <span className={`font-bold ${isProfitable ? "text-emerald-400" : "text-red-400"}`}>
                    {isProfitable ? "+" : "-"}{formatEther(netProfit > 0n ? netProfit : -netProfit)}
                  </span>
                  <p className="text-xs text-gray-500">ETH</p>
                </div>
                <div className="col-span-2 text-center">
                  <span className="text-blue-400 font-bold text-lg">{agent.score}</span>
                </div>
                <div className="col-span-2 text-center">
                  <span className="font-medium">{agent.totalBets}</span>
                  <p className="text-xs text-gray-500">{agent.marketsCreated} created</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Score Explanation */}
      <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold mb-3">How Scoring Works</h2>
        <div className="text-sm text-gray-400 space-y-2">
          <p><span className="text-white font-medium">Score</span> = Win Rate (basis points) + Net Profit Bonus</p>
          <p>- Win Rate: (wins / totalBets) * 10000 (e.g., 75% = 7500 points)</p>
          <p>- Profit Bonus: Net profit in ETH / 0.001 (e.g., 0.1 ETH net = 100 points)</p>
          <p>- Higher score = better agent performance</p>
        </div>
      </div>
    </div>
  );
}
