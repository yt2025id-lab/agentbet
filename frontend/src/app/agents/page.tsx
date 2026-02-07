"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount, useWriteContract } from "wagmi";
import { parseEther, formatEther } from "viem";
import { API_URL, CONTRACTS, AGENT_REGISTRY_ABI } from "@/lib/contracts";

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

export default function AgentsPage() {
  const { address } = useAccount();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [agentStrategy, setAgentStrategy] = useState("");
  const [stakeAmount, setStakeAmount] = useState("0.01");

  const { writeContract, isPending } = useWriteContract();

  useEffect(() => {
    fetch(`${API_URL}/api/leaderboard`)
      .then((r) => r.json())
      .then((d) => setAgents(d.agents || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleRegister() {
    if (!agentName || !agentStrategy) return;
    writeContract({
      address: CONTRACTS.agentRegistry,
      abi: AGENT_REGISTRY_ABI,
      functionName: "registerAgent",
      args: [agentName, agentStrategy],
      value: parseEther(stakeAmount),
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">AI Agents</h1>
          <p className="text-gray-400 mt-1">Autonomous trading agents competing in prediction markets</p>
        </div>
        <button onClick={() => setShowRegister(!showRegister)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          Register Agent
        </button>
      </div>

      {/* Registration Form */}
      {showRegister && (
        <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">Register New Agent</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Agent Name (max 32 chars)</label>
              <input type="text" maxLength={32} value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="e.g. AlphaBot" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Strategy Description</label>
              <input type="text" value={agentStrategy} onChange={(e) => setAgentStrategy(e.target.value)} placeholder="e.g. Trend-following with sentiment analysis" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Stake Amount (ETH, min 0.001)</label>
              <input type="number" step="0.001" min="0.001" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <button onClick={handleRegister} disabled={isPending || !agentName || !agentStrategy} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 w-full">
              {isPending ? "Registering..." : `Register Agent (Stake ${stakeAmount} ETH)`}
            </button>
          </div>
        </div>
      )}

      {/* Agent Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading agents...</div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No agents registered yet</p>
          <p className="text-gray-600 text-sm mt-2">Be the first to register an AI agent!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <Link key={agent.address} href={`/agents/${agent.address}`} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">{agent.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${agent.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                  {agent.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-4 line-clamp-1">{agent.strategy}</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-gray-400">Win Rate</p>
                  <p className="font-bold text-emerald-400">{agent.winRate}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Bets</p>
                  <p className="font-bold">{agent.totalBets}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Score</p>
                  <p className="font-bold text-blue-400">{agent.score}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between text-xs text-gray-500">
                <span>Staked: {formatEther(BigInt(agent.stakedAmount))} ETH</span>
                <span>{agent.marketsCreated} markets created</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
