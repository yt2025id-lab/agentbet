"use client";

import { useParams } from "next/navigation";
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
      <div className="text-center py-12 text-gray-500">
        Loading agent profile from chain...
      </div>
    );
  }

  const totalBets = Number(agent.totalBets);
  const wins = Number(agent.wins);
  const losses = Number(agent.losses);
  const winRate =
    totalBets > 0 ? ((wins / totalBets) * 100).toFixed(1) : "0.0";
  const netProfit = BigInt(agent.totalProfit) - BigInt(agent.totalLoss);
  const isProfitable = netProfit > 0n;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">
              {agent.name || "Unnamed Agent"}
            </h1>
            <p className="text-gray-500 font-mono text-sm mt-1">
              {agentAddress}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm ${agent.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
          >
            {agent.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <p className="text-gray-400">
          {agent.strategy || "No strategy set"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400">Score</p>
          <p className="text-2xl font-bold text-blue-400">
            {Number(agent.score)}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400">Win Rate</p>
          <p className="text-2xl font-bold text-emerald-400">{winRate}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400">Total Bets</p>
          <p className="text-2xl font-bold">{totalBets}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400">Net P&L</p>
          <p
            className={`text-2xl font-bold ${isProfitable ? "text-emerald-400" : netProfit < 0n ? "text-red-400" : "text-gray-400"}`}
          >
            {isProfitable ? "+" : netProfit < 0n ? "-" : ""}
            {formatEther(netProfit > 0n ? netProfit : -netProfit)} ETH
          </p>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Performance Details</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Wins</span>
            <span className="text-emerald-400 font-bold">{wins}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Losses</span>
            <span className="text-red-400 font-bold">{losses}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Profit</span>
            <span className="text-emerald-400">
              {formatEther(BigInt(agent.totalProfit))} ETH
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Loss</span>
            <span className="text-red-400">
              {formatEther(BigInt(agent.totalLoss))} ETH
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Staked Amount</span>
            <span>{formatEther(BigInt(agent.stakedAmount))} ETH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Markets Created</span>
            <span>{Number(agent.marketsCreated)}</span>
          </div>
        </div>
      </div>

      {/* Win/Loss Bar */}
      {totalBets > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Win/Loss Distribution</h2>
          <div className="w-full h-6 bg-red-500/30 rounded-full">
            <div
              className="h-full bg-emerald-500 rounded-l-full transition-all"
              style={{ width: `${parseFloat(winRate)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-emerald-400">
              {wins} Wins ({winRate}%)
            </span>
            <span className="text-red-400">
              {losses} Losses ({(100 - parseFloat(winRate)).toFixed(1)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
