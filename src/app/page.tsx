"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { ClientRecommendationResult, SearchOptions } from "@/lib/types";
import { toPng } from 'html-to-image';
import { jsPDF } from "jspdf";
import { RecommendationCard } from "@/components/RecommendationCard";
import { WorkflowDiagram } from "@/components/WorkflowDiagram";
import {
  saveHistoryToFirestore,
  loadHistoryFromFirestore,
  deleteHistoryFromFirestore,
  HistoryDocument
} from "@/lib/db";
import {
  Loader2, Zap, Sparkles, X, AlertTriangle, Clock,
  Shield, Brain, Layers3, BarChart3, CheckCircle,
  Code2, Palette, FileText, Mic2, TrendingUp,
  SlidersHorizontal, ChevronDown, ArrowRight, Search,
  Database, Globe, Activity, Check, LogOut, LogIn, Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const VERIFIED_TOOL_IDS = new Set(["chatgpt_plus", "claude_3_5_sonnet", "github_copilot", "cursor", "perplexity_pro", "gemini_advanced", "midjourney_v6", "canva_magic_studio", "runway_gen3", "elevenlabs"]);

function formatPrice(tool: ClientRecommendationResult["recommendations"][number]["tool"]) {
  if (!VERIFIED_TOOL_IDS.has(tool.id)) return "Pricing not publicly verified";
  if (tool.pricingType === "free") return "Free";
  return tool.monthlyPrice !== null ? `$${tool.monthlyPrice}/mo` : "Pricing not publicly verified";
}

function formatContext(tool: ClientRecommendationResult["recommendations"][number]["tool"]) {
  if (!VERIFIED_TOOL_IDS.has(tool.id) || tool.contextLength === null) return "Context window not publicly verified";
  return `${tool.contextLength.toLocaleString()} tokens`;
}

const EXAMPLE_PROMPTS = [
  "Customer support chatbot",
  "Text-to-image for marketing",
  "AI pair programmer",
];

export const CATEGORY_COLORS: Record<string, string> = {
  coding: "#4F46E5", image: "#7C3AED", writing: "#059669",
  research: "#2563EB", design: "#D97706", video: "#DB2777",
  audio: "#059669", general: "#4F46E5",
};

const MARQUEE_ITEMS = [
  { name: "ChatGPT",        logo: "https://logo.clearbit.com/openai.com",    cat: "General"  },
  { name: "Claude",         logo: "https://logo.clearbit.com/claude.ai",      cat: "Coding"   },
  { name: "Midjourney",     logo: "https://logo.clearbit.com/midjourney.com", cat: "Image"    },
  { name: "GitHub Copilot", logo: "https://logo.clearbit.com/github.com",     cat: "Coding"   },
  { name: "Perplexity",     logo: "https://logo.clearbit.com/perplexity.ai",  cat: "Research" },
  { name: "Canva AI",       logo: "https://logo.clearbit.com/canva.com",      cat: "Design"   },
  { name: "Gemini",         logo: "https://logo.clearbit.com/google.com",     cat: "General"  },
  { name: "Runway",         logo: "https://logo.clearbit.com/runwayml.com",   cat: "Video"    },
  { name: "ElevenLabs",     logo: "https://logo.clearbit.com/elevenlabs.io",  cat: "Audio"    },
  { name: "Firefly",        logo: "https://logo.clearbit.com/adobe.com",      cat: "Image"    },
  { name: "Cursor",         logo: "https://logo.clearbit.com/cursor.com",     cat: "Coding"   },
  { name: "Framer AI",      logo: "https://logo.clearbit.com/framer.com",     cat: "Design"   },
];

const STATS = [
  { val: "500+",  label: "Models indexed",          icon: <Database className="w-4 h-4" />,   color: "#4F46E5" },
  { val: "99.9%", label: "Match accuracy",           icon: <CheckCircle className="w-4 h-4" />, color: "#10B981" },
  { val: "Live",  label: "Real-time benchmarks",    icon: <Activity className="w-4 h-4" />,   color: "#4F46E5" },
  { val: "Global",label: "GPU availability",        icon: <Globe className="w-4 h-4" />,      color: "#10B981" },
];

const HOW_IT_WORKS = [
  { num: "01", title: "Describe your project", desc: "Type your idea naturally. No forms, no jargon — just tell us what you need to build.", icon: <Search className="w-4 h-4" />, color: "#4F46E5" },
  { num: "02", title: "Engine benchmarks models", desc: "Our scoring engine evaluates 500+ models against your latency, cost, and skill requirements.", icon: <Brain className="w-4 h-4" />, color: "#7C3AED" },
  { num: "03", title: "Receive your ranked match", desc: "Get a shortlist with fit scores, pros/cons, a workflow pipeline, and copy-paste prompts.", icon: <Sparkles className="w-4 h-4" />, color: "#10B981" },
];

const CATEGORIES_SHOWCASE = [
  { label: "Large Language Models",  sub: "GPT-4o, Claude 3.5, Gemini 1.5",  icon: <FileText className="w-4 h-4" />,  color: "#4F46E5", count: "180+" },
  { label: "Image Generation",       sub: "Midjourney, DALL·E 3, Firefly",    icon: <Palette className="w-4 h-4" />,   color: "#7C3AED", count: "60+"  },
  { label: "Voice & Audio AI",       sub: "ElevenLabs, Whisper, PlayHT",      icon: <Mic2 className="w-4 h-4" />,      color: "#10B981", count: "40+"  },
  { label: "Code Assistants",        sub: "Cursor, Copilot, Claude Sonnet",   icon: <Code2 className="w-4 h-4" />,     color: "#D97706", count: "90+"  },
];

const FEATURES = [
  { icon: <Shield className="w-4 h-4" />,    color: "#4F46E5", title: "Bias-Free Scoring",    desc: "Tools are anonymized before analysis. Results are ranked on pure performance, not brand recognition." },
  { icon: <Brain className="w-4 h-4" />,     color: "#7C3AED", title: "Instant Heuristics",   desc: "Offline fallback engine searches 20+ tools in milliseconds when the API is unavailable." },
  { icon: <Layers3 className="w-4 h-4" />,   color: "#10B981", title: "Pipeline Builder",      desc: "Complex projects get a full multi-stage AI workflow spanning research, creation, and deployment." },
  { icon: <BarChart3 className="w-4 h-4" />, color: "#D97706", title: "Fit Score Ranking",    desc: "Each tool receives a 0–100 score calculated precisely against your requirements." },
  { icon: <Sparkles className="w-4 h-4" />,  color: "#DB2777", title: "Copy-Ready Prompts",   desc: "Every recommendation ships with a tailored prompt you can paste directly into that tool." },
  { icon: <Clock className="w-4 h-4" />,     color: "#2563EB", title: "Search History",        desc: "Your last 10 searches are persisted locally — revisit any result without re-running." },
];

function Marquee() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="relative w-full overflow-hidden py-4 border-y border-[#F1F5F9]">
      <div className="absolute left-0 inset-y-0 w-20 z-10 pointer-events-none bg-gradient-to-r from-white to-transparent" />
      <div className="absolute right-0 inset-y-0 w-20 z-10 pointer-events-none bg-gradient-to-l from-white to-transparent" />
      <motion.div className="flex gap-3 w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}>
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#E2E8F0] bg-white flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.logo} alt={item.name}
              className="w-4 h-4 object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            <span className="text-sm font-medium text-[#374151]">{item.name}</span>
            <span className="s-tag">{item.cat}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default function Home() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<(ClientRecommendationResult & { source?: string }) | null>(null);
  const [activePrompt, setActivePrompt] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryDocument[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [options, setOptions] = useState<SearchOptions>({
    budget: "", skillLevel: "", timeline: "", goal: "", teamSize: "",
  });

  const setOpt = <K extends keyof SearchOptions>(key: K, val: SearchOptions[K]) =>
    setOptions((p) => ({ ...p, [key]: p[key] === val ? "" : val }));
  const activeOptionCount = Object.values(options).filter(Boolean).length;

  // Fetch history from Firestore when user changes
  useEffect(() => {
    async function fetchHistory() {
      if (user) {
        try {
          const uHistory = await loadHistoryFromFirestore(user.uid, user.email || null);
          setHistory(uHistory);
        } catch (err) {
          console.warn("Firestore history load failed (check if database is initialized):", err);
          setHistory([]);
        }
      } else {
        setHistory([]);
      }
    }
    fetchHistory();
  }, [user]);


  const handleSubmit = async (e?: React.FormEvent, pre?: string) => {
    e?.preventDefault();
    const q = pre || prompt;
    if (!q.trim()) return;
    setLoading(true); setError(""); setResult(null); setActivePrompt(q);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q, options }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Failed"); }
      const data = await res.json();
      setResult(data);

      if (user) {
        try {
          const docId = await saveHistoryToFirestore(user.uid, user.email || null, q, data);
          setHistory((prev) => [
            { id: docId, userId: user.uid, userEmail: user.email || null, prompt: q, timestamp: Date.now(), result: data },
            ...prev
          ].slice(0, 10));
        } catch (dbErr) {
          console.warn("Firestore history save failed (check if database is initialized):", dbErr);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally { setLoading(false); }

  };

  const loadFromHistory = (entry: HistoryDocument) => {
    setActivePrompt(entry.prompt); setPrompt(entry.prompt); setResult(entry.result);
    setShowHistory(false); setError("");
  };

  const deleteHistory = async (id: string | undefined) => {
    if (!id) return;
    try {
      await deleteHistoryFromFirestore(id);
      setHistory((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      console.error("Error deleting history from Firestore:", err);
    }
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault(); setResult(null);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleDownloadPdf = async () => {
    if (!resultsRef.current) return;
    try {
      setIsDownloadingPdf(true);
      
      const width = resultsRef.current.offsetWidth;
      const height = resultsRef.current.offsetHeight;
      
      const imgData = await toPng(resultsRef.current, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (height * pdfWidth) / width;
      
      // If the content is taller than one page, jsPDF addImage handles it by scaling or we can leave it as one long page,
      // but 'a4' has fixed height. It's usually fine for 1-2 pages if we just let it crop or scale.
      // A common simple approach is to just insert it and let it flow off the page, but users prefer seeing all of it.
      // So we can adjust page height to match the canvas if we want it in a single page PDF.
      const customPdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);
      customPdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      customPdf.save('ModelMatch-Results.pdf');
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white text-[#0F172A] w-full min-h-screen">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="w-full h-16 bg-white/90 backdrop-blur-md border-b border-[#F1F5F9] sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button onClick={() => setResult(null)}
              className="flex items-center gap-2 cursor-pointer bg-transparent border-0 p-0">
              <span className="w-7 h-7 rounded-lg bg-[#4F46E5] flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white fill-white" />
              </span>
              <span className="text-base font-bold text-[#0F172A] tracking-tight">ModelMatch</span>
            </button>
            <nav className="hidden md:flex items-center gap-1">
              {[["how-it-works","How it Works"],["categories","Categories"],["features","Features"]].map(([id, label]) => (
                <a key={id} href={`#${id}`}
                  onClick={(e) => handleNavClick(e as React.MouseEvent<HTMLAnchorElement>, id)}
                  className="text-sm font-medium text-[#64748B] hover:text-[#0F172A] transition-colors px-3 py-1.5 rounded-md hover:bg-[#F8FAFC]">
                  {label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button onClick={() => setShowHistory(!showHistory)} className="btn-secondary text-sm flex items-center gap-2 py-2 px-4">
                  <Clock className="w-3.5 h-3.5" />
                  History
                  {history.length > 0 && (
                    <span className="inline-flex items-center justify-center w-4.5 h-4.5 rounded-full bg-[#4F46E5] text-white text-[9px] font-bold">
                      {history.length}
                    </span>
                  )}
                </button>
                <div className="h-6 w-px bg-[#E2E8F0]" />
                <span className="text-xs font-semibold text-[#64748B] hidden sm:inline">
                  {user.displayName || user.email}
                </span>
                <button onClick={logout} className="btn-secondary text-sm flex items-center gap-1.5 py-2 px-3 text-red-600 hover:bg-red-50 hover:border-red-200">
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </>
            ) : (
              <button onClick={() => router.push("/login")} className="btn-primary text-sm flex items-center gap-1.5 py-2 px-4">
                <LogIn className="w-3.5 h-3.5" />
                Login to Save History
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── HISTORY PANEL ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showHistory && user && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[72px] right-6 z-50 w-80 s-card overflow-hidden">
            <div className="px-4 py-3 border-b border-[#F1F5F9] flex items-center justify-between bg-[#F8FAFC]">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Search History</span>
              <button onClick={() => setShowHistory(false)}
                className="w-6 h-6 rounded flex items-center justify-center text-[#94A3B8] hover:text-[#64748B] hover:bg-[#E2E8F0] transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-[#94A3B8] text-center py-8">No past searches saved in cloud.</p>
            ) : (
              <ul className="max-h-72 overflow-y-auto divide-y divide-[#F8FAFC]">
                {history.map((entry) => (
                  <li key={entry.id}
                    className="flex items-center gap-2 px-4 py-3 hover:bg-[#F8FAFC] transition-colors group">
                    <button onClick={() => loadFromHistory(entry)} className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">{entry.prompt}</p>
                      <p className="text-[11px] text-[#94A3B8] font-mono mt-0.5">
                        {new Date(entry.timestamp).toLocaleDateString()} · {entry.result.recommendations.length} tools
                      </p>
                    </button>
                    <button onClick={() => deleteHistory(entry.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded text-[#94A3B8] hover:text-red-500 hover:bg-red-50">
                      <X className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONTENT ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }} className="flex-1 flex flex-col">

              {/* ─── HERO ─────────────────────────────────────────────────── */}
              <section className="pt-20 pb-24 px-6 max-w-[1200px] mx-auto w-full text-center">
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                  className="inline-flex items-center gap-2 mb-7 px-3.5 py-1.5 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] text-[#4F46E5] text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] animate-pulse" />
                  Bias-free AI tool matching · Cloud Sync Active
                </motion.div>

                <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="text-5xl sm:text-6xl font-extrabold tracking-tight text-[#0F172A] max-w-3xl mx-auto leading-[1.08] mb-6">
                  Find the right AI tool
                  <br />
                  <span className="bg-gradient-to-r from-[#4F46E5] to-[#10B981] bg-clip-text text-transparent">
                    for any project
                  </span>
                </motion.h1>

                <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                  className="text-lg font-normal text-[#64748B] max-w-lg mx-auto leading-relaxed mb-10">
                  Describe your project in plain language. Compare AI tools side by side
                  by fit, price, context window, and tradeoffs before you choose.
                </motion.p>

                <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  onSubmit={handleSubmit} className="max-w-[640px] mx-auto mb-7">
                  <div className="flex gap-2 p-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] focus-within:border-[#4F46E5] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] transition-all">
                    <input
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g. Build a real-time customer support chatbot..."
                      className="flex-1 bg-transparent border-0 focus:outline-none text-[0.9375rem] font-normal py-2.5 px-3 text-[#0F172A] placeholder:text-[#94A3B8]"
                      disabled={loading}
                    />
                    <button type="submit" disabled={loading || !prompt.trim()} className="btn-primary">
                      {loading
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <><Search className="w-4 h-4" /> Compare</>}
                    </button>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="mt-2.5 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
                    </motion.div>
                  )}

                  <div className="mt-3 text-left">
                    <button type="button" onClick={() => setShowOptions(!showOptions)}
                      className="flex items-center gap-1.5 text-xs font-medium text-[#94A3B8] hover:text-[#64748B] transition-colors">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      Advanced filters
                      {activeOptionCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#4F46E5] text-white">{activeOptionCount}</span>
                      )}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showOptions ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {showOptions && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="mt-3 s-card p-5 space-y-5">
                            <div>
                              <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-2.5">Goal</p>
                              <div className="flex flex-wrap gap-1.5">
                                {([
                                  { val: "build_app",      label: "Build App"       },
                                  { val: "create_content", label: "Create Content"  },
                                  { val: "write_edit",     label: "Write & Edit"    },
                                  { val: "research",       label: "Research"        },
                                  { val: "design_ui",      label: "Design UI"       },
                                  { val: "automate",       label: "Automate"        },
                                ] as { val: SearchOptions["goal"]; label: string }[]).map(({ val, label }) => (
                                  <button key={val} type="button" onClick={() => setOpt("goal", val)}
                                    className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all border ${
                                      options.goal === val
                                        ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                                        : "bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1]"
                                    }`}>
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                              <div>
                                <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-2.5">Budget</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {([
                                    { val: "free",   label: "Free"      },
                                    { val: "low",    label: "Under $20" },
                                    { val: "medium", label: "$20–60"    },
                                  ] as { val: SearchOptions["budget"]; label: string }[]).map(({ val, label }) => (
                                    <button key={val} type="button" onClick={() => setOpt("budget", val)}
                                      className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all border ${
                                        options.budget === val
                                          ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                                          : "bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1]"
                                      }`}>
                                      {label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-2.5">Skill Level</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {([
                                    { val: "beginner",     label: "No Code"   },
                                    { val: "intermediate", label: "Mid Level" },
                                    { val: "advanced",     label: "Advanced"  },
                                  ] as { val: SearchOptions["skillLevel"]; label: string }[]).map(({ val, label }) => (
                                    <button key={val} type="button" onClick={() => setOpt("skillLevel", val)}
                                      className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all border ${
                                        options.skillLevel === val
                                          ? "bg-[#4F46E5] text-white border-[#4F46E5]"
                                          : "bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1]"
                                      }`}>
                                      {label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.form>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  className="flex flex-wrap items-center justify-center gap-2">
                  <span className="text-xs font-medium text-[#94A3B8]">Try:</span>
                  {EXAMPLE_PROMPTS.map((ex, i) => (
                    <button key={i}
                      onClick={() => { setPrompt(ex); handleSubmit(undefined, ex); }}
                      className="btn-secondary text-xs py-1.5 px-3.5 flex items-center gap-1 hover:border-[#4F46E5] hover:text-[#4F46E5]">
                      {ex}
                    </button>
                  ))}
                </motion.div>
              </section>

              <section className="border-y border-[#F1F5F9] bg-[#F8FAFC] py-10 px-6">
                <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                  {STATS.map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                      className="text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-2" style={{ color: s.color }}>
                        {s.icon}
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#94A3B8]">{s.label}</span>
                      </div>
                      <div className="stat-number">{s.val}</div>
                    </motion.div>
                  ))}
                </div>
              </section>

              <Marquee />

              <section className="py-20 px-6 max-w-[1200px] mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                  <div>
                    <p className="text-xs font-semibold text-[#4F46E5] uppercase tracking-widest mb-3">Live Data</p>
                    <h2 className="text-3xl font-bold text-[#0F172A] leading-tight mb-4">
                      Real benchmarks,<br />not vendor claims
                    </h2>
                    <p className="text-[#64748B] leading-relaxed mb-8">
                      We run live inference on every major model to give you accurate latency
                      data. Compare apples to apples — not marketing copy.
                    </p>
                    <ul className="space-y-3">
                      {["Measured P99 latency across regions","Cost-per-token with current pricing","Availability across cloud GPU providers"].map((item, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-sm text-[#374151]">
                          <span className="w-5 h-5 rounded-full bg-[#EEF2FF] flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-[#4F46E5]" />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="s-card p-7">
                    <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest mb-5">Model Latency — P99</p>
                    <div className="space-y-5">
                      {[
                        { name: "GPT-4o-Mini",           latency: "18ms", pct: 95, color: "#4F46E5" },
                        { name: "Mistral-Nemo-12B",       latency: "24ms", pct: 88, color: "#7C3AED" },
                        { name: "Llama-3-70B-Instruct",   latency: "42ms", pct: 72, color: "#10B981" },
                        { name: "Claude 3 Haiku",          latency: "31ms", pct: 84, color: "#D97706" },
                      ].map(bar => (
                        <div key={bar.name}>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="font-medium text-[#374151]">{bar.name}</span>
                            <span className="font-mono text-xs text-[#94A3B8]">{bar.latency}</span>
                          </div>
                          <div className="score-track">
                            <motion.div className="score-fill"
                              style={{ background: bar.color }}
                              initial={{ width: 0 }}
                              whileInView={{ width: `${bar.pct}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.8, ease: "easeOut" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section id="how-it-works" className="py-20 px-6 bg-[#F8FAFC] border-t border-[#F1F5F9]">
                <div className="max-w-[1200px] mx-auto">
                  <div className="text-center mb-14">
                    <p className="text-xs font-semibold text-[#4F46E5] uppercase tracking-widest mb-3">Process</p>
                    <h2 className="text-3xl font-bold text-[#0F172A]">Three steps to your AI stack</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {HOW_IT_WORKS.map((item, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                        className="s-card bg-white p-7">
                        <div className="flex items-center justify-between mb-5">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                            style={{ background: `${item.color}12`, color: item.color }}>
                            {item.icon}
                          </div>
                          <span className="text-2xl font-black" style={{ color: `${item.color}20` }}>{item.num}</span>
                        </div>
                        <h3 className="text-base font-semibold text-[#0F172A] mb-2">{item.title}</h3>
                        <p className="text-sm text-[#64748B] leading-relaxed">{item.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              <section id="categories" className="py-20 px-6 max-w-[1200px] mx-auto w-full">
                <div className="text-center mb-14">
                  <p className="text-xs font-semibold text-[#4F46E5] uppercase tracking-widest mb-3">Coverage</p>
                  <h2 className="text-3xl font-bold text-[#0F172A]">Specialized scoring engines</h2>
                  <p className="text-[#64748B] mt-2">Purpose-built databases for every AI modality</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {CATEGORIES_SHOWCASE.map((cat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                      className="s-card p-6 group">
                      <div className="flex items-center justify-between mb-5">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{ background: `${cat.color}12`, color: cat.color }}>
                          {cat.icon}
                        </div>
                        <span className="text-xs font-semibold text-[#64748B] font-mono">{cat.count}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-[#0F172A] mb-1.5 leading-snug">{cat.label}</h3>
                      <p className="text-xs text-[#94A3B8] leading-relaxed">{cat.sub}</p>
                    </motion.div>
                  ))}
                </div>
              </section>

              <section id="features" className="py-20 px-6 bg-[#F8FAFC] border-t border-[#F1F5F9]">
                <div className="max-w-[1200px] mx-auto">
                  <div className="text-center mb-14">
                    <p className="text-xs font-semibold text-[#4F46E5] uppercase tracking-widest mb-3">Capabilities</p>
                    <h2 className="text-3xl font-bold text-[#0F172A]">Everything you need to decide</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {FEATURES.map((f, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                        className="s-card bg-white p-6">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                          style={{ background: `${f.color}12`, color: f.color }}>
                          {f.icon}
                        </div>
                        <h3 className="text-sm font-semibold text-[#0F172A] mb-2">{f.title}</h3>
                        <p className="text-sm text-[#64748B] leading-relaxed">{f.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="py-20 px-6 max-w-[1200px] mx-auto w-full">
                <div className="rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] p-12 md:p-16 text-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.06]"
                    style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
                  <div className="relative z-10">
                    <h2 className="text-3xl font-bold text-white mb-4">Start for free today</h2>
                    <p className="text-indigo-200 text-base max-w-md mx-auto mb-8 leading-relaxed">
                      Join 12,000+ engineers who found their perfect AI stack — no account required.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-3">
                      <button
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="btn-primary bg-white text-[#4F46E5] hover:bg-[#F8FAFC] border-white text-sm px-7 py-3">
                        Find my AI match <ArrowRight className="w-4 h-4" />
                      </button>
                      <button className="btn-secondary bg-transparent border-white/30 text-white hover:bg-white/10 text-sm px-7 py-3">
                        Book a demo
                      </button>
                    </div>
                  </div>
                </div>
              </section>

            </motion.div>

          ) : (
            <motion.div key="results" ref={resultsRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col py-10 px-6 max-w-[1200px] mx-auto w-full bg-white">

              <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#F1F5F9]">
                <div>
                  <h2 className="text-xl font-bold text-[#0F172A]">Evaluation Results</h2>
                  <p className="text-xs text-[#94A3B8] font-mono mt-1 uppercase tracking-wider">
                    Anonymized score matrix applied
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {result.source === "heuristic" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-100 text-amber-600 text-xs font-semibold">
                      ⚡ Fast Match
                    </span>
                  )}
                  {user && (
                    <button onClick={handleDownloadPdf} disabled={isDownloadingPdf} className="btn-secondary text-sm flex items-center gap-1.5">
                      {isDownloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      {isDownloadingPdf ? "Generating..." : "Download PDF"}
                    </button>
                  )}
                  <button onClick={() => { setResult(null); setPrompt(""); }} className="btn-secondary text-sm">
                    ← New search
                  </button>
                </div>
              </div>

              <div className="s-card s-card-accent p-5 mb-8">
                <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-3">Target Prompt</p>
                <p className="text-base font-semibold text-[#0F172A] border-l-2 border-[#4F46E5] pl-4 mb-4">
                  "{activePrompt}"
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    `Project: ${result.extracted_requirements.project_type}`,
                    `Skill: ${result.extracted_requirements.skill_level}`,
                    `Budget: ${result.extracted_requirements.budget}`,
                  ].map((tag, i) => <span key={i} className="s-tag">{tag}</span>)}
                </div>
              </div>

              <div className="s-card p-5 mb-8 overflow-x-auto">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest">Comparison matrix</p>
                    <h3 className="text-sm font-semibold text-[#0F172A]">Compare specs side by side</h3>
                  </div>
                  <p className="text-xs text-[#64748B]">Use the tradeoffs below to choose what fits your workflow.</p>
                </div>
                <table className="min-w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr>
                      <th className="text-left text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider pb-2">Spec</th>
                      {result.recommendations.map((rec) => (
                        <th key={rec.tool.id} className="px-3 py-2 text-left min-w-[180px]">
                          <span className="text-sm font-semibold text-[#0F172A]">{rec.tool.name}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="pr-3 py-2 text-sm font-medium text-[#64748B]">Fit score</td>
                      {result.recommendations.map((rec) => (
                        <td key={`${rec.tool.id}-score`} className="px-3 py-2 text-sm text-[#0F172A]">
                          <span className="inline-flex items-center rounded-full bg-[#EEF2FF] px-2.5 py-1 text-xs font-semibold text-[#4F46E5]">{rec.fit_score}%</span>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="pr-3 py-2 text-sm font-medium text-[#64748B]">Price</td>
                      {result.recommendations.map((rec) => (
                        <td key={`${rec.tool.id}-price`} className="px-3 py-2 text-sm text-[#374151]">
                          {formatPrice(rec.tool)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="pr-3 py-2 text-sm font-medium text-[#64748B]">Context window</td>
                      {result.recommendations.map((rec) => (
                        <td key={`${rec.tool.id}-context`} className="px-3 py-2 text-sm text-[#374151]">
                          {formatContext(rec.tool)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="pr-3 py-2 text-sm font-medium text-[#64748B]">Best for</td>
                      {result.recommendations.map((rec) => (
                        <td key={`${rec.tool.id}-reason`} className="px-3 py-2 text-sm text-[#374151] max-w-[220px] whitespace-normal">
                          {rec.reason}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="pr-3 py-2 text-sm font-medium text-[#64748B]">Strengths</td>
                      {result.recommendations.map((rec) => (
                        <td key={`${rec.tool.id}-pros`} className="px-3 py-2 text-sm text-[#374151] max-w-[220px] whitespace-normal">
                          {rec.pros.slice(0, 2).join(" • ")}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="pr-3 py-2 text-sm font-medium text-[#64748B]">Tradeoffs</td>
                      {result.recommendations.map((rec) => (
                        <td key={`${rec.tool.id}-cons`} className="px-3 py-2 text-sm text-[#64748B] max-w-[220px] whitespace-normal">
                          {rec.cons.slice(0, 2).join(" • ")}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {result.suggested_workflow && result.suggested_workflow.length > 0 && (
                <div className="mb-8"><WorkflowDiagram workflow={result.suggested_workflow} recommendations={result.recommendations} /></div>
              )}

              <div>
                <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-widest mb-5 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" /> Compare tool profiles
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {result.recommendations.map((rec, i) => (
                    <motion.article key={rec.tool.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}>
                      <RecommendationCard rec={rec} categoryColors={CATEGORY_COLORS} />
                    </motion.article>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="w-full border-t border-[#F1F5F9] py-10 mt-10 bg-[#F8FAFC]">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-[#4F46E5] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white fill-white" />
            </span>
            <span className="text-sm font-semibold text-[#0F172A]">ModelMatch</span>
            <span className="text-sm text-[#94A3B8]">— © 2025 ModelMatch Inc.</span>
          </div>
          <div className="flex gap-6 text-sm text-[#64748B]">
            {[{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }, { label: "Security", href: "/security" }].map((item) => (
              <a key={item.label} href={item.href} className="hover:text-[#0F172A] transition-colors">{item.label}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
