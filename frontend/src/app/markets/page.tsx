"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatEther } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import {
  CONTRACTS,
  PREDICTION_MARKET_ABI,
  MarketStatus,
} from "@/lib/contracts";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-emerald-500/20 text-emerald-400",
  SETTLEMENT_REQUESTED: "bg-yellow-500/20 text-yellow-400",
  SETTLED: "bg-blue-500/20 text-blue-400",
  CANCELLED: "bg-red-500/20 text-red-400",
};

function PoolBar({ yesPool, noPool }: { yesPool: bigint; noPool: bigint }) {
  const total = yesPool + noPool;
  const yesPercent = total > 0n ? Number((yesPool * 100n) / total) : 50;
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-emerald-400">YES {yesPercent}%</span>
        <span className="text-red-400">NO {100 - yesPercent}%</span>
      </div>
      <div className="w-full h-2 bg-red-500/30 rounded-full">
        <div
          className="h-full bg-emerald-500 rounded-l-full transition-all"
          style={{ width: `${yesPercent}%` }}
        />
      </div>
    </div>
  );
}

export default function MarketsPage() {
  const [filter, setFilter] = useState("all");

  const { data: nextMarketId, isLoading: isLoadingCount } = useReadContract({
    address: CONTRACTS.predictionMarket,
    abi: PREDICTION_MARKET_ABI,
    functionName: "nextMarketId",
    query: { refetchInterval: 10000 },
  });

  const marketCount = nextMarketId ? Number(nextMarketId) : 0;

  // Batch-read all markets via multicall
  const marketContracts = useMemo(() => {
    return Array.from({ length: marketCount }, (_, i) => ({
      address: CONTRACTS.predictionMarket,
      abi: PREDICTION_MARKET_ABI,
      functionName: "getMarket" as const,
      args: [BigInt(i)] as const,
    }));
  }, [marketCount]);

  const { data: marketsData, isLoading: isLoadingMarkets } = useReadContracts({
    contracts: marketContracts,
    query: { refetchInterval: 10000 },
  });

  const loading = isLoadingCount || isLoadingMarkets;

  const markets = useMemo(() => {
    if (!marketsData) return [];
    return marketsData
      .map((result, i) => {
        if (result.status !== "success" || !result.result) return null;
        const m = result.result as any;
        return { id: i, ...m };
      })
      .filter(Boolean)
      .reverse(); // newest first
  }, [marketsData]);

  const filtered = markets.filter((m: any) => {
    if (filter === "all") return true;
    return MarketStatus[m.status as keyof typeof MarketStatus] === filter;
  });

  const now = Math.floor(Date.now() / 1000);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Prediction Markets</h1>
          <p className="text-gray-400 mt-1">
            AI-created and human markets powered by Chainlink CRE
          </p>
        </div>
        <span className="text-sm text-gray-500">{marketCount} markets</span>
      </div>

      <div className="flex gap-2 mb-6">
        {["all", "OPEN", "SETTLEMENT_REQUESTED", "SETTLED"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-blue-500 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {f === "all"
              ? "All"
              : f === "SETTLEMENT_REQUESTED"
                ? "Settling"
                : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          Loading markets from chain...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No markets yet</p>
          <p className="text-gray-600 text-sm mt-2">
            Markets are created autonomously by AI agents via CRE workflows, or
            by users via x402 payments.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m: any) => {
            const status =
              MarketStatus[m.status as keyof typeof MarketStatus];
            const yesPool = BigInt(m.yesPool);
            const noPool = BigInt(m.noPool);
            const remaining = Number(m.deadline) - now;
            const timeLabel =
              remaining <= 0
                ? "Expired"
                : remaining > 86400
                  ? `${Math.floor(remaining / 86400)}d left`
                  : `${Math.floor(remaining / 3600)}h left`;

            return (
              <Link
                key={m.id}
                href={`/markets/${m.id}`}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[status] || ""}`}
                  >
                    {status}
                  </span>
                  {m.isAgentCreated && (
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                      AI
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-sm mb-3 line-clamp-2">
                  {m.question}
                </h3>
                <PoolBar yesPool={yesPool} noPool={noPool} />
                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                  <span>
                    {yesPool + noPool > 0n
                      ? formatEther(yesPool + noPool)
                      : "0"}{" "}
                    ETH
                  </span>
                  <span>{Number(m.totalBettors)} bettors</span>
                  <span
                    className={
                      remaining <= 0 ? "text-red-400" : "text-yellow-400"
                    }
                  >
                    {timeLabel}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
