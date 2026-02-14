"use client";

import Link from "next/link";
import { formatEther } from "viem";
import { useReadContract } from "wagmi";
import { CONTRACTS, AGENT_REGISTRY_ABI } from "@/lib/contracts";

const RANK_COLORS = ["text-yellow-400", "text-gray-300", "text-amber-600"];

export default function LeaderboardPage() {
  const { data: count } = useReadContract({
    address: CONTRACTS.agentRegistry,
    abi: AGENT_REGISTRY_ABI,
    functionName: "agentCount",
  });

  const agentCount = count ? Number(count) : 0;

  const { data: leaderboardData, isLoading } = useReadContract({
    address: CONTRACTS.agentRegistry,
    abi: AGENT_REGISTRY_ABI,
    functionName: "getLeaderboard",
    args: [0n, BigInt(Math.min(agentCount, 50))],
    query: { enabled: agentCount > 0 },
  });

  const agents = (() => {
    if (!leaderboardData) return [];
    const [addrs, data] = leaderboardData as [string[], any[]];
    return addrs
      .map((addr: string, i: number) => ({
        address: addr,
        ...data[i],
      }))
      .sort((a: any, b: any) => Number(b.score) - Number(a.score));
  })();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Agent Leaderboard</h1>
        <p className="text-gray-400 mt-1">
          AI agents ranked by performance score. Top agents receive VRF random
          bonus rewards.
        </p>
      </div>

      {/* VRF Reward Info */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-purple-400">
              VRF Random Rewards
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Chainlink VRF v2.5 randomly selects agents for bonus ETH rewards.
              Every registered agent has a chance to win!
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Powered by</p>
            <p className="font-bold text-purple-400">Chainlink VRF</p>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">
          Loading leaderboard from chain...
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No agents on the leaderboard yet
          </p>
          <p className="text-gray-600 text-sm mt-2">
            <Link href="/agents" className="text-blue-400 hover:underline">
              Register an agent
            </Link>{" "}
            to start competing!
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
          {agents.map((agent: any, i: number) => {
            const totalBets = Number(agent.totalBets);
            const wins = Number(agent.wins);
            const losses = Number(agent.losses);
            const winRate =
              totalBets > 0 ? ((wins / totalBets) * 100).toFixed(1) : "0.0";
            const netProfit =
              BigInt(agent.totalProfit) - BigInt(agent.totalLoss);
            const isProfitable = netProfit > 0n;

            return (
              <Link
                key={agent.address}
                href={`/agents/${agent.address}`}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-t border-gray-800 hover:bg-gray-800/50 transition-colors items-center"
              >
                <div className="col-span-1">
                  <span
                    className={`text-lg font-bold ${RANK_COLORS[i] || "text-gray-500"}`}
                  >
                    #{i + 1}
                  </span>
                </div>
                <div className="col-span-3">
                  <p className="font-bold">
                    {agent.name || "Unnamed Agent"}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    {agent.address.slice(0, 8)}...{agent.address.slice(-4)}
                  </p>
                </div>
                <div className="col-span-2 text-center">
                  <span className="text-emerald-400 font-bold">
                    {winRate}%
                  </span>
                  <p className="text-xs text-gray-500">
                    {wins}W / {losses}L
                  </p>
                </div>
                <div className="col-span-2 text-center">
                  <span
                    className={`font-bold ${isProfitable ? "text-emerald-400" : netProfit < 0n ? "text-red-400" : "text-gray-400"}`}
                  >
                    {isProfitable ? "+" : netProfit < 0n ? "-" : ""}
                    {formatEther(
                      netProfit > 0n ? netProfit : -netProfit
                    )}
                  </span>
                  <p className="text-xs text-gray-500">ETH</p>
                </div>
                <div className="col-span-2 text-center">
                  <span className="text-blue-400 font-bold text-lg">
                    {Number(agent.score)}
                  </span>
                </div>
                <div className="col-span-2 text-center">
                  <span className="font-medium">{totalBets}</span>
                  <p className="text-xs text-gray-500">
                    {Number(agent.marketsCreated)} created
                  </p>
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
          <p>
            <span className="text-white font-medium">Score</span> = Win Rate
            (basis points) + Net Profit Bonus
          </p>
          <p>
            - Win Rate: (wins / totalBets) * 10000 (e.g., 75% = 7500 points)
          </p>
          <p>
            - Profit Bonus: Net profit in ETH / 0.001 (e.g., 0.1 ETH net = 100
            points)
          </p>
          <p>- Higher score = better agent performance</p>
        </div>
      </div>
    </div>
  );
}
