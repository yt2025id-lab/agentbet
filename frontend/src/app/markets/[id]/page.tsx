"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { parseEther, formatEther } from "viem";
import { CONTRACTS, PREDICTION_MARKET_ABI, MarketStatus, OutcomeLabel } from "@/lib/contracts";

export default function MarketDetailPage() {
  const params = useParams();
  const marketId = BigInt(params.id as string);
  const { address } = useAccount();
  const [betAmount, setBetAmount] = useState("0.01");

  const { data: market } = useReadContract({
    address: CONTRACTS.predictionMarket,
    abi: PREDICTION_MARKET_ABI,
    functionName: "getMarket",
    args: [marketId],
    query: { refetchInterval: 5000 },
  });

  const { data: prediction } = useReadContract({
    address: CONTRACTS.predictionMarket,
    abi: PREDICTION_MARKET_ABI,
    functionName: "getPrediction",
    args: address ? [marketId, address] : undefined,
    query: { refetchInterval: 5000 },
  });

  const { writeContract: placeBet, isPending: isBetting, isSuccess: betSuccess, isError: betError } = useWriteContract();
  const { writeContract: claimWinnings, isPending: isClaiming, isSuccess: claimSuccess } = useWriteContract();
  const { writeContract: requestSettle, isPending: isSettling } = useWriteContract();

  if (!market) {
    return <div className="text-center py-12 text-gray-500">Loading market...</div>;
  }

  const status = MarketStatus[market.status as keyof typeof MarketStatus];
  const yesPool = market.yesPool;
  const noPool = market.noPool;
  const totalPool = yesPool + noPool;
  const yesPercent = totalPool > 0n ? Number((yesPool * 100n) / totalPool) : 50;
  const now = Math.floor(Date.now() / 1000);
  const isExpired = now >= Number(market.deadline);
  const hasBet = prediction && prediction.amount > 0n;
  const canClaim = hasBet && market.status === 2 && prediction.choice === market.outcome && !prediction.claimed;

  function handleBet(choice: number) {
    placeBet({
      address: CONTRACTS.predictionMarket,
      abi: PREDICTION_MARKET_ABI,
      functionName: "predict",
      args: [marketId, choice],
      value: parseEther(betAmount),
    });
  }

  function handleClaim() {
    claimWinnings({
      address: CONTRACTS.predictionMarket,
      abi: PREDICTION_MARKET_ABI,
      functionName: "claim",
      args: [marketId],
    });
  }

  function handleRequestSettlement() {
    requestSettle({
      address: CONTRACTS.predictionMarket,
      abi: PREDICTION_MARKET_ABI,
      functionName: "requestSettlement",
      args: [marketId],
    });
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className={`text-xs px-3 py-1 rounded-full ${status === "OPEN" ? "bg-emerald-500/20 text-emerald-400" : status === "SETTLED" ? "bg-blue-500/20 text-blue-400" : "bg-yellow-500/20 text-yellow-400"}`}>
            {status}
          </span>
          {market.isAgentCreated && <span className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full">AI Created</span>}
          <span className="text-xs text-gray-500">Market #{params.id}</span>
        </div>
        <h1 className="text-2xl font-bold">{market.question}</h1>
      </div>

      {/* Pool Visualization */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <div className="flex justify-between mb-2">
          <div>
            <span className="text-2xl font-bold text-emerald-400">{yesPercent}%</span>
            <span className="text-sm text-gray-400 ml-2">YES</span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-red-400">{100 - yesPercent}%</span>
            <span className="text-sm text-gray-400 ml-2">NO</span>
          </div>
        </div>
        <div className="w-full h-4 bg-red-500/30 rounded-full mb-4">
          <div className="h-full bg-emerald-500 rounded-l-full transition-all" style={{ width: `${yesPercent}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <p className="text-gray-400">YES Pool</p>
            <p className="font-bold">{formatEther(yesPool)} ETH</p>
          </div>
          <div>
            <p className="text-gray-400">Total Pool</p>
            <p className="font-bold">{formatEther(totalPool)} ETH</p>
          </div>
          <div>
            <p className="text-gray-400">NO Pool</p>
            <p className="font-bold">{formatEther(noPool)} ETH</p>
          </div>
        </div>
      </div>

      {/* Bet Form */}
      {status === "OPEN" && !isExpired && !hasBet && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Place Your Prediction</h2>
          <div className="mb-4">
            <label className="text-sm text-gray-400 block mb-2">Bet Amount (ETH)</label>
            <input type="number" step="0.001" min="0.001" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleBet(0)} disabled={isBetting || !address} className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50">
              {isBetting ? "Confirming..." : "Bet YES"}
            </button>
            <button onClick={() => handleBet(1)} disabled={isBetting || !address} className="bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50">
              {isBetting ? "Confirming..." : "Bet NO"}
            </button>
          </div>
          {!address && (
            <p className="text-yellow-400 text-xs mt-3 text-center">Connect your wallet to place a bet</p>
          )}
          {betSuccess && (
            <p className="text-emerald-400 text-sm mt-3 text-center font-medium">Bet placed successfully!</p>
          )}
          {betError && (
            <p className="text-red-400 text-sm mt-3 text-center">Transaction failed. Please try again.</p>
          )}
        </div>
      )}

      {/* Your Prediction */}
      {hasBet && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-3">Your Prediction</h2>
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-lg font-bold ${prediction.choice === 0 ? "text-emerald-400" : "text-red-400"}`}>
                {OutcomeLabel[prediction.choice as keyof typeof OutcomeLabel]}
              </span>
              <span className="text-gray-400 ml-3">{formatEther(prediction.amount)} ETH</span>
              {prediction.isAgent && <span className="ml-2 text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">Agent</span>}
            </div>
            {canClaim && (
              <button onClick={handleClaim} disabled={isClaiming} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50">
                {isClaiming ? "Claiming..." : "Claim Winnings"}
              </button>
            )}
            {prediction.claimed && <span className="text-emerald-400 text-sm">Claimed</span>}
          </div>
          {claimSuccess && (
            <p className="text-emerald-400 text-sm mt-3 font-medium">Winnings claimed successfully!</p>
          )}
        </div>
      )}

      {/* Settlement */}
      {status === "OPEN" && isExpired && (
        <div className="bg-gray-900 border border-yellow-500/30 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-3 text-yellow-400">Market Expired - Ready for Settlement</h2>
          <p className="text-sm text-gray-400 mb-4">This market has passed its deadline. Request AI-powered settlement via Chainlink CRE + Gemini.</p>
          <button onClick={handleRequestSettlement} disabled={isSettling} className="bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50">
            {isSettling ? "Requesting..." : "Request AI Settlement"}
          </button>
        </div>
      )}

      {/* Settlement Result */}
      {status === "SETTLED" && (
        <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-3 text-blue-400">Market Settled</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Outcome</p>
              <p className={`text-2xl font-bold ${market.outcome === 0 ? "text-emerald-400" : "text-red-400"}`}>
                {OutcomeLabel[market.outcome as keyof typeof OutcomeLabel]}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">AI Confidence</p>
              <p className="text-2xl font-bold">{(Number(market.confidenceScore) / 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-bold mb-3">Market Info</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Bettors</span>
            <span>{Number(market.totalBettors)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Deadline</span>
            <span>{new Date(Number(market.deadline) * 1000).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Created</span>
            <span>{new Date(Number(market.createdAt) * 1000).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Creator</span>
            <span className="font-mono text-xs">{market.creator.slice(0, 8)}...{market.creator.slice(-6)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Platform Fee</span>
            <span>2%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
