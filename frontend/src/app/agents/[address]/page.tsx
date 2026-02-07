"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatEther } from "viem";
import { API_URL } from "@/lib/contracts";

interface AgentProfile {
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
  registeredAt: number;
  isActive: boolean;
  score: number;
  winRate: string;
}

export default function AgentProfilePage() {
  const params = useParams();
  const [agent, setAgent] = useState<AgentProfile | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/agents/${params.address}`)
      .then((r) => r.json())
      .then(setAgent)
      .catch(() => {});
  }, [params.address]);

  if (!agent) {
    return <div className="text-center py-12 text-gray-500">Loading agent profile...</div>;
  }

  const netProfit = BigInt(agent.totalProfit) - BigInt(agent.totalLoss);
  const isProfitable = netProfit > 0n;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">{agent.name}</h1>
            <p className="text-gray-500 font-mono text-sm mt-1">{agent.address}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm ${agent.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
            {agent.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <p className="text-gray-400">{agent.strategy}</p>
        <p className="text-xs text-gray-600 mt-2">Registered: {new Date(agent.registeredAt * 1000).toLocaleDateString()}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400">Score</p>
          <p className="text-2xl font-bold text-blue-400">{agent.score}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400">Win Rate</p>
          <p className="text-2xl font-bold text-emerald-400">{agent.winRate}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400">Total Bets</p>
          <p className="text-2xl font-bold">{agent.totalBets}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-400">Net P&L</p>
          <p className={`text-2xl font-bold ${isProfitable ? "text-emerald-400" : "text-red-400"}`}>
            {isProfitable ? "+" : "-"}{formatEther(netProfit > 0n ? netProfit : -netProfit)} ETH
          </p>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Performance Details</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Wins</span>
            <span className="text-emerald-400 font-bold">{agent.wins}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Losses</span>
            <span className="text-red-400 font-bold">{agent.losses}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Profit</span>
            <span className="text-emerald-400">{formatEther(BigInt(agent.totalProfit))} ETH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Loss</span>
            <span className="text-red-400">{formatEther(BigInt(agent.totalLoss))} ETH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Staked Amount</span>
            <span>{formatEther(BigInt(agent.stakedAmount))} ETH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Markets Created</span>
            <span>{agent.marketsCreated}</span>
          </div>
        </div>
      </div>

      {/* Win/Loss Bar */}
      {agent.totalBets > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Win/Loss Distribution</h2>
          <div className="w-full h-6 bg-red-500/30 rounded-full">
            <div className="h-full bg-emerald-500 rounded-l-full transition-all" style={{ width: `${parseFloat(agent.winRate)}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-emerald-400">{agent.wins} Wins ({agent.winRate}%)</span>
            <span className="text-red-400">{agent.losses} Losses ({(100 - parseFloat(agent.winRate)).toFixed(1)}%)</span>
          </div>
        </div>
      )}
    </div>
  );
}
