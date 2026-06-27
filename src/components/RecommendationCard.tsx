"use client";

import { EnrichedRecommendation } from "@/lib/types";
import { Copy, ExternalLink, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const VERIFIED_TOOL_IDS = new Set(["chatgpt_plus", "claude_3_5_sonnet", "github_copilot", "cursor", "perplexity_pro", "gemini_advanced", "midjourney_v6", "canva_magic_studio", "runway_gen3", "elevenlabs"]);

function formatPrice(tool: EnrichedRecommendation["tool"]) {
  if (!VERIFIED_TOOL_IDS.has(tool.id)) return "Pricing not publicly verified";
  if (tool.pricingType === "free") return "Free";
  return tool.monthlyPrice !== null ? `$${tool.monthlyPrice}/mo` : "Pricing not publicly verified";
}

function formatContext(tool: EnrichedRecommendation["tool"]) {
  if (!VERIFIED_TOOL_IDS.has(tool.id) || tool.contextLength === null) return "Context window not publicly verified";
  return `${tool.contextLength.toLocaleString()} tokens`;
}

interface RecommendationCardProps {
  rec: EnrichedRecommendation;
  categoryColors?: Record<string, string>;
}

const CATEGORY_COLOR: Record<string, string> = {
  coding:   "#4F46E5",
  image:    "#7C3AED",
  writing:  "#059669",
  research: "#2563EB",
  design:   "#D97706",
  video:    "#DB2777",
  audio:    "#059669",
  general:  "#4F46E5",
};

export function RecommendationCard({ rec }: RecommendationCardProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(rec.prompt_generator);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  let logoUrl = rec.tool.logoURL;
  try {
    const url = new URL(rec.tool.websiteLink);
    logoUrl = `https://logo.clearbit.com/${url.hostname}`;
  } catch {}

  const color = CATEGORY_COLOR[rec.tool.category] ?? "#4F46E5";

  return (
    <div className="s-card flex flex-col h-full overflow-hidden">
      {/* Top accent line */}
      <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />

      {/* Header */}
      <div className="p-5 pb-4 flex items-start gap-3.5">
        {/* Logo */}
        <div className="relative flex-shrink-0">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={rec.tool.name}
              className="w-11 h-11 rounded-lg object-contain p-1.5 bg-[#F8FAFC] border border-[#E2E8F0]"
              onError={(e) => {
                const el = e.currentTarget as HTMLImageElement;
                el.style.display = "none";
                const fb = el.nextElementSibling as HTMLElement;
                if (fb) fb.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className="w-11 h-11 rounded-lg hidden items-center justify-center text-sm font-bold border border-[#E2E8F0]"
            style={{ background: `${color}10`, color }}
          >
            {rec.tool.name.charAt(0)}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[#0F172A] leading-tight">{rec.tool.name}</h3>
              <span
                className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
                style={{ background: `${color}10`, color, border: `1px solid ${color}20` }}
              >
                {rec.tool.category}
              </span>
            </div>
            <div className="flex-shrink-0 text-right">
              <span className="text-lg font-bold" style={{ color }}>{rec.fit_score}%</span>
              <p className="text-[8px] font-semibold text-[#94A3B8] uppercase tracking-widest leading-none mt-0.5">fit score</p>
            </div>
          </div>

          {/* Score bar */}
          <div className="score-track mt-3">
            <motion.div
              className="score-fill"
              style={{ background: color }}
              initial={{ width: 0 }}
              animate={{ width: `${rec.fit_score}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Reason */}
      <div className="px-5 pb-4">
        <p className="text-sm text-[#64748B] leading-relaxed">
          {rec.reason}
        </p>
      </div>

      <div className="px-5 pb-4 grid grid-cols-2 gap-2 border-t border-[#F1F5F9] pt-4">
        <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3">
          <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest">Pricing</p>
          <p className="mt-1 text-sm font-semibold text-[#0F172A]">{formatPrice(rec.tool)}</p>
        </div>
        <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3">
          <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest">Context</p>
          <p className="mt-1 text-sm font-semibold text-[#0F172A]">{formatContext(rec.tool)}</p>
        </div>
      </div>

      {/* Pros / Cons */}
      <div className="px-5 pb-4 grid grid-cols-2 gap-4 border-t border-[#F1F5F9] pt-4">
        <div>
          <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-[#10B981]" /> Strengths
          </p>
          <ul className="space-y-1.5">
            {rec.pros.slice(0, 3).map((p, i) => (
              <li key={i} className="text-xs text-[#64748B] flex items-start gap-1.5 leading-relaxed">
                <span className="text-[#10B981] mt-0.5 flex-shrink-0">›</span> {p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3 text-[#EF4444]" /> Limitations
          </p>
          <ul className="space-y-1.5">
            {rec.cons.slice(0, 3).map((c, i) => (
              <li key={i} className="text-xs text-[#64748B] flex items-start gap-1.5 leading-relaxed">
                <span className="text-[#EF4444] mt-0.5 flex-shrink-0">›</span> {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Prompt — uses sans-serif, NOT monospace */}
      <div className="px-5 pb-4 flex-1">
        <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3.5">
          <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3 h-3" style={{ color }} /> Target Prompt
          </p>
          <p className={`text-[13px] text-[#374151] leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>
            {rec.prompt_generator}
          </p>
          {rec.prompt_generator.length > 120 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs font-medium mt-1.5 hover:underline"
              style={{ color }}
            >
              {expanded ? "Show less ↑" : "Show more ↓"}
            </button>
          )}
        </div>
      </div>

      {/* Alternative Option Block */}
      {rec.alternative_tool && (
        <div className="px-5 pb-4">
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-3.5 flex items-center justify-between gap-3 shadow-sm hover:border-[#CBD5E1] transition-all">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xs">🔄</span>
              <div className="flex flex-col min-w-0">
                <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest leading-none">Alternate Option</p>
                <p className="text-xs font-bold text-[#0F172A] truncate mt-1">{rec.alternative_tool.name}</p>
              </div>
            </div>
            <a
              href={rec.alternative_tool.websiteLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-[11px] font-semibold py-1.5 px-3 flex items-center gap-1 hover:border-[#4F46E5] hover:text-[#4F46E5] transition-colors"
              style={{ textDecoration: "none" }}
            >
              <span>Visit Alt</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}


      {/* Footer */}
      <div className="px-5 pb-5 pt-3 flex items-center justify-between border-t border-[#F1F5F9]">
        <span className="text-xs font-semibold text-[#374151]">
          {formatPrice(rec.tool)}
        </span>
        <div className="flex gap-2">
          <button onClick={handleCopy} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
            <Copy className="w-3.5 h-3.5" />
            {copied ? "Copied!" : "Copy Prompt"}
          </button>
          <a href={rec.tool.websiteLink} target="_blank" rel="noopener noreferrer"
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5" style={{ textDecoration: "none" }}>
            Visit <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
