"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useReadContract, useAccount } from "wagmi";
import { parseEther, formatEther } from "viem";
import { CONTRACTS, PREDICTION_MARKET_ABI, MarketStatus, OutcomeLabel } from "@/lib/contracts";
import { useSponsoredWrite } from "@/hooks/useSponsoredWrite";

const PRESET_AMOUNTS = ["0.001", "0.005", "0.01", "0.05"];

const STATUS_META: Record<string, { color: string; bg: string; border: string; label: string }> = {
  OPEN: { color: "var(--neon-green)", bg: "rgba(0,255,136,0.12)", border: "rgba(0,255,136,0.4)", label: "Open" },
  SETTLEMENT_REQUESTED: { color: "var(--amber)", bg: "rgba(255,184,0,0.12)", border: "rgba(255,184,0,0.4)", label: "Settling" },
  SETTLED: { color: "var(--electric-cyan)", bg: "rgba(0,245,255,0.12)", border: "rgba(0,245,255,0.4)", label: "Settled" },
  CANCELLED: { color: "var(--hot-pink)", bg: "rgba(255,51,102,0.12)", border: "rgba(255,51,102,0.4)", label: "Cancelled" },
};

function SectionCard({
  children,
  borderColor = "rgba(0,245,255,0.15)",
}: {
  children: React.ReactNode;
  borderColor?: string;
}) {
  return (
    <div
      style={{
        background: "var(--midnight)",
        border: `1px solid ${borderColor}`,
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "20px",
      }}
    >
      {children}
    </div>
  );
}

export default function MarketDetailPage() {
  const params = useParams();
  const router = useRouter();
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

  const { write: placeBet, isPending: isBetting, isSuccess: betSuccess, isError: betError, isSponsored } = useSponsoredWrite();
  const { write: claimWinnings, isPending: isClaiming, isSuccess: claimSuccess } = useSponsoredWrite();
  const { write: requestSettle, isPending: isSettling } = useSponsoredWrite();

  if (!market) {
    return (
      <div className="flex flex-col items-center justify-center py-24" style={{ color: "var(--text-muted)" }}>
        <div
          className="w-10 h-10 rounded-full mb-4"
          style={{
            border: "2px solid rgba(0,245,255,0.15)",
            borderTopColor: "var(--electric-cyan)",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p>Loading market...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const status = MarketStatus[market.status as keyof typeof MarketStatus];
  const meta = STATUS_META[status] || { color: "#fff", bg: "transparent", border: "rgba(255,255,255,0.2)", label: status };
  const yesPool = market.yesPool;
  const noPool = market.noPool;
  const totalPool = yesPool + noPool;
  const yesPercent = totalPool > 0n ? Number((yesPool * 100n) / totalPool) : 50;
  const now = Math.floor(Date.now() / 1000);
  const isExpired = now >= Number(market.deadline);
  const hasBet = prediction && prediction.amount > 0n;
  const canClaim = hasBet && market.status === 2 && prediction.choice === market.outcome && !prediction.claimed;

  const remainingSecs = Number(market.deadline) - now;
  const deadlineLabel = remainingSecs > 0
    ? remainingSecs > 86400
      ? `${Math.floor(remainingSecs / 86400)}d ${Math.floor((remainingSecs % 86400) / 3600)}h left`
      : `${Math.floor(remainingSecs / 3600)}h ${Math.floor((remainingSecs % 3600) / 60)}m left`
    : "Expired";

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
      {/* Back nav */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 mb-6 transition-all duration-200 hover:gap-3"
        style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontSize: "13px" }}
      >
        <span>←</span>
        <span>Back to Markets</span>
      </button>

      {/* Header */}
      <SectionCard>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span
            className="text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider"
            style={{
              fontFamily: "var(--font-rajdhani)",
              color: meta.color,
              background: meta.bg,
              border: `1px solid ${meta.border}`,
            }}
          >
            {meta.label}
          </span>
          {market.isAgentCreated && (
            <span
              className="text-xs px-3 py-1 rounded-full font-bold"
              style={{ color: "var(--neon-pink)", background: "rgba(255,0,255,0.1)", border: "1px solid rgba(255,0,255,0.3)" }}
            >
              AI Created
            </span>
          )}
          <span
            className="text-xs px-2 py-1 rounded-lg"
            style={{ color: "var(--text-muted)", background: "rgba(255,255,255,0.04)", fontFamily: "var(--font-ibm-plex-mono)" }}
          >
            Market #{params.id}
          </span>
          <span
            className="ml-auto text-xs"
            style={{
              color: remainingSecs <= 0 ? "var(--hot-pink)" : "var(--amber)",
              fontFamily: "var(--font-ibm-plex-mono)",
            }}
          >
            {deadlineLabel}
          </span>
        </div>
        <h1
          className="text-xl font-bold leading-snug"
          style={{ fontFamily: "var(--font-rajdhani)", color: "var(--text-primary)" }}
        >
          {market.question}
        </h1>
      </SectionCard>

      {/* Pool Visualization */}
      <SectionCard>
        <h2
          className="text-xs font-bold uppercase tracking-widest mb-4"
          style={{ fontFamily: "var(--font-rajdhani)", color: "var(--text-muted)" }}
        >
          Market Odds
        </h2>
        <div className="flex justify-between items-end mb-3">
          <div>
            <span
              className="font-bold"
              style={{ color: "var(--neon-green)", fontFamily: "var(--font-rajdhani)", fontSize: "36px", lineHeight: 1 }}
            >
              {yesPercent}%
            </span>
            <span className="text-sm ml-2" style={{ color: "var(--text-muted)" }}>YES</span>
          </div>
          <div className="text-right">
            <span
              className="font-bold"
              style={{ color: "var(--hot-pink)", fontFamily: "var(--font-rajdhani)", fontSize: "36px", lineHeight: 1 }}
            >
              {100 - yesPercent}%
            </span>
            <span className="text-sm ml-2" style={{ color: "var(--text-muted)" }}>NO</span>
          </div>
        </div>
        <div className="w-full rounded-full overflow-hidden mb-5" style={{ height: "10px", background: "rgba(255,51,102,0.2)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${yesPercent}%`,
              background: "linear-gradient(90deg, var(--neon-green), rgba(0,255,136,0.6))",
              boxShadow: "0 0 10px rgba(0,255,136,0.5)",
            }}
          />
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: "YES Pool", value: `${formatEther(yesPool)} ETH`, color: "var(--neon-green)" },
            { label: "Total Pool", value: `${formatEther(totalPool)} ETH`, color: "var(--electric-cyan)" },
            { label: "NO Pool", value: `${formatEther(noPool)} ETH`, color: "var(--hot-pink)" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl py-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p style={{ color: "var(--text-muted)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
                {item.label}
              </p>
              <p
                className="font-bold"
                style={{ color: item.color, fontFamily: "var(--font-ibm-plex-mono)", fontSize: "13px" }}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Bet Form */}
      {status === "OPEN" && !isExpired && !hasBet && (
        <SectionCard borderColor="rgba(0,245,255,0.2)">
          <h2
            className="text-sm font-bold mb-4 uppercase tracking-wider"
            style={{ fontFamily: "var(--font-rajdhani)", color: "var(--electric-cyan)" }}
          >
            Place Your Prediction
          </h2>

          {/* Preset amounts */}
          <div className="mb-3">
            <label className="text-xs block mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Quick select
            </label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setBetAmount(preset)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150"
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono)",
                    background: betAmount === preset ? "rgba(0,245,255,0.15)" : "rgba(255,255,255,0.04)",
                    color: betAmount === preset ? "var(--electric-cyan)" : "var(--text-muted)",
                    border: betAmount === preset ? "1px solid rgba(0,245,255,0.5)" : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {preset} ETH
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div className="mb-5">
            <label className="text-xs block mb-2 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Custom amount (ETH)
            </label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-white transition-all"
              style={{
                background: "var(--card-bg)",
                border: "1.5px solid rgba(0,245,255,0.2)",
                outline: "none",
                fontFamily: "var(--font-ibm-plex-mono)",
                fontSize: "14px",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--electric-cyan)";
                e.currentTarget.style.boxShadow = "0 0 12px rgba(0,245,255,0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(0,245,255,0.2)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleBet(0)}
              disabled={isBetting || !address}
              className="py-3.5 rounded-xl font-bold uppercase tracking-wider transition-all duration-200 disabled:opacity-40"
              style={{
                background: "rgba(0,255,136,0.12)",
                border: "1.5px solid var(--neon-green)",
                color: "var(--neon-green)",
                fontFamily: "var(--font-rajdhani)",
                fontSize: "15px",
              }}
              onMouseEnter={(e) => {
                if (!isBetting && address) {
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--neon-green)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--deep-space)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(0,255,136,0.4)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,255,136,0.12)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--neon-green)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              {isBetting ? "Confirming..." : "✓ Bet YES"}
            </button>
            <button
              onClick={() => handleBet(1)}
              disabled={isBetting || !address}
              className="py-3.5 rounded-xl font-bold uppercase tracking-wider transition-all duration-200 disabled:opacity-40"
              style={{
                background: "rgba(255,51,102,0.12)",
                border: "1.5px solid var(--hot-pink)",
                color: "var(--hot-pink)",
                fontFamily: "var(--font-rajdhani)",
                fontSize: "15px",
              }}
              onMouseEnter={(e) => {
                if (!isBetting && address) {
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--hot-pink)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(255,51,102,0.4)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,51,102,0.12)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--hot-pink)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              {isBetting ? "Confirming..." : "✗ Bet NO"}
            </button>
          </div>

          {isSponsored && (
            <div className="mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-xl" style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.2)" }}>
              <span style={{ fontSize: "12px" }}>⛽</span>
              <span style={{ fontSize: "11px", color: "var(--neon-green)", fontFamily: "var(--font-ibm-plex-mono)", fontWeight: 600 }}>Gas Sponsored</span>
            </div>
          )}
          {!address && (
            <p className="text-xs mt-3 text-center" style={{ color: "var(--amber)" }}>
              Connect your wallet to place a prediction
            </p>
          )}
          {betSuccess && (
            <div
              className="mt-4 px-4 py-3 rounded-xl text-sm text-center font-medium"
              style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.3)", color: "var(--neon-green)" }}
            >
              Prediction placed successfully!
            </div>
          )}
          {betError && (
            <div
              className="mt-4 px-4 py-3 rounded-xl text-sm text-center"
              style={{ background: "rgba(255,51,102,0.08)", border: "1px solid rgba(255,51,102,0.3)", color: "var(--hot-pink)" }}
            >
              Transaction failed. Please try again.
            </div>
          )}
        </SectionCard>
      )}

      {/* Your Prediction */}
      {hasBet && (
        <SectionCard borderColor="rgba(0,245,255,0.3)">
          <h2
            className="text-sm font-bold mb-4 uppercase tracking-wider"
            style={{ fontFamily: "var(--font-rajdhani)", color: "var(--electric-cyan)" }}
          >
            Your Prediction
          </h2>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div
                className="px-4 py-2 rounded-xl"
                style={{
                  background: prediction.choice === 0 ? "rgba(0,255,136,0.1)" : "rgba(255,51,102,0.1)",
                  border: `1px solid ${prediction.choice === 0 ? "rgba(0,255,136,0.4)" : "rgba(255,51,102,0.4)"}`,
                }}
              >
                <span
                  className="text-lg font-bold"
                  style={{
                    color: prediction.choice === 0 ? "var(--neon-green)" : "var(--hot-pink)",
                    fontFamily: "var(--font-rajdhani)",
                  }}
                >
                  {OutcomeLabel[prediction.choice as keyof typeof OutcomeLabel]}
                </span>
              </div>
              <div>
                <p className="font-bold" style={{ color: "var(--text-primary)", fontFamily: "var(--font-ibm-plex-mono)", fontSize: "14px" }}>
                  {formatEther(prediction.amount)} ETH
                </p>
                {prediction.isAgent && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: "var(--neon-pink)", background: "rgba(255,0,255,0.1)" }}>
                    Agent
                  </span>
                )}
                {prediction.claimed && (
                  <span className="text-xs" style={{ color: "var(--neon-green)" }}>✓ Claimed</span>
                )}
              </div>
            </div>
            {canClaim && (
              <button
                onClick={handleClaim}
                disabled={isClaiming}
                className="px-6 py-3 rounded-xl font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, var(--electric-cyan), var(--neon-pink))",
                  color: "var(--deep-space)",
                  fontFamily: "var(--font-rajdhani)",
                  fontSize: "15px",
                  boxShadow: "0 0 24px rgba(0,245,255,0.35)",
                }}
              >
                {isClaiming ? "Claiming..." : "Claim Winnings"}
              </button>
            )}
          </div>
          {claimSuccess && (
            <div
              className="mt-4 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.3)", color: "var(--neon-green)" }}
            >
              Winnings claimed successfully!
            </div>
          )}
        </SectionCard>
      )}

      {/* Settlement Request */}
      {status === "OPEN" && isExpired && (
        <SectionCard borderColor="rgba(255,184,0,0.3)">
          <h2
            className="text-sm font-bold mb-2 uppercase tracking-wider"
            style={{ fontFamily: "var(--font-rajdhani)", color: "var(--amber)" }}
          >
            Market Expired — Ready for Settlement
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
            This market has passed its deadline. Request AI-powered settlement via Chainlink CRE + Gemini.
          </p>
          <button
            onClick={handleRequestSettlement}
            disabled={isSettling}
            className="px-6 py-3 rounded-xl font-bold uppercase tracking-wider transition-all disabled:opacity-50"
            style={{
              background: "rgba(255,184,0,0.12)",
              border: "1.5px solid var(--amber)",
              color: "var(--amber)",
              fontFamily: "var(--font-rajdhani)",
              fontSize: "14px",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--amber)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--deep-space)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(255,184,0,0.4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,184,0,0.12)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--amber)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
            }}
          >
            {isSettling ? "Requesting..." : "⚡ Request AI Settlement"}
          </button>
        </SectionCard>
      )}

      {/* Settlement Result */}
      {status === "SETTLED" && (
        <SectionCard borderColor="rgba(0,245,255,0.3)">
          <h2
            className="text-sm font-bold mb-4 uppercase tracking-wider"
            style={{ fontFamily: "var(--font-rajdhani)", color: "var(--electric-cyan)" }}
          >
            Market Settled
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div
              className="rounded-xl p-4 text-center"
              style={{
                background: market.outcome === 0 ? "rgba(0,255,136,0.08)" : "rgba(255,51,102,0.08)",
                border: `1px solid ${market.outcome === 0 ? "rgba(0,255,136,0.3)" : "rgba(255,51,102,0.3)"}`,
              }}
            >
              <p style={{ color: "var(--text-muted)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
                Outcome
              </p>
              <p
                className="font-bold"
                style={{
                  color: market.outcome === 0 ? "var(--neon-green)" : "var(--hot-pink)",
                  fontFamily: "var(--font-rajdhani)",
                  fontSize: "28px",
                }}
              >
                {OutcomeLabel[market.outcome as keyof typeof OutcomeLabel]}
              </p>
            </div>
            <div
              className="rounded-xl p-4 text-center"
              style={{ background: "rgba(0,245,255,0.06)", border: "1px solid rgba(0,245,255,0.2)" }}
            >
              <p style={{ color: "var(--text-muted)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
                AI Confidence
              </p>
              <p
                className="font-bold"
                style={{ color: "var(--electric-cyan)", fontFamily: "var(--font-rajdhani)", fontSize: "28px" }}
              >
                {(Number(market.confidenceScore) / 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Market Info */}
      <SectionCard>
        <h2
          className="text-sm font-bold mb-4 uppercase tracking-wider"
          style={{ fontFamily: "var(--font-rajdhani)", color: "var(--electric-cyan)" }}
        >
          Market Info
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Bettors", value: String(Number(market.totalBettors)), mono: false },
            { label: "Platform Fee", value: "2%", mono: false },
            { label: "Deadline", value: new Date(Number(market.deadline) * 1000).toLocaleString(), mono: false },
            { label: "Created", value: new Date(Number(market.createdAt) * 1000).toLocaleString(), mono: false },
            { label: "Creator", value: `${market.creator.slice(0, 8)}...${market.creator.slice(-6)}`, mono: true },
          ].map((row) => (
            <div
              key={row.label}
              className="rounded-xl px-4 py-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", gridColumn: row.label === "Creator" ? "span 2" : undefined }}
            >
              <p style={{ color: "var(--text-muted)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
                {row.label}
              </p>
              <p
                className="font-semibold"
                style={{
                  color: "var(--text-primary)",
                  fontFamily: row.mono ? "var(--font-ibm-plex-mono)" : "inherit",
                  fontSize: row.mono ? "12px" : "14px",
                }}
              >
                {row.value}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
