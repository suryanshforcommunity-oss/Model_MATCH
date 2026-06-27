import toolsData from "@/data/tools.json";
import { Tool, ClientRecommendationResult, SearchOptions } from "@/lib/types";

const VERIFIED_TOOL_IDS = new Set(["chatgpt_plus", "claude_3_5_sonnet", "github_copilot", "cursor", "perplexity_pro", "gemini_advanced", "midjourney_v6", "canva_magic_studio", "runway_gen3", "elevenlabs"]);

const KEYWORD_MAP: Record<string, string[]> = {
  coding:   ["code", "codebase", "coding", "developer", "app", "website", "api", "backend", "frontend", "software", "refactor", "debug", "next", "react", "python", "javascript", "typescript", "program", "bot", "automation", "mobile app", "build"],
  image:    ["image", "photo", "picture", "art", "illustration", "logo", "visual", "graphic", "banner", "poster", "photorealistic", "generate", "asset", "stock", "photography", "marketing asset"],
  writing:  ["write", "writing", "blog", "article", "content", "copy", "email", "seo", "post", "newsletter", "script", "story", "text", "document", "caption", "social media", "screenplay", "dialogue"],
  research: ["research", "search", "find", "information", "facts", "web", "citations", "meeting", "transcribe", "notes", "data", "analyze", "source", "summarize"],
  design:   ["design", "ui", "ux", "interface", "landing page", "mockup", "figma", "wireframe", "prototype", "layout", "template", "saas", "product", "brand"],
  video:    ["video", "film", "clip", "avatar", "animation", "motion", "youtube", "explainer", "corporate", "training", "shorts", "movie", "screenplay", "storyboard"],
  audio:    ["audio", "voice", "speech", "podcast", "text-to-speech", "tts", "narration", "sound", "voiceover"],
  general:  ["chat", "assistant", "help", "general", "question", "answer", "brainstorm", "plan", "explain", "ideas"],
};

const GOAL_CATEGORY_MAP: Record<string, string[]> = {
  build_app:       ["coding", "design"],
  create_content:  ["writing", "image", "video"],
  write_edit:      ["writing", "general"],
  research:        ["research", "general"],
  design_ui:       ["design", "image"],
  generate_media:  ["image", "video", "audio"],
  automate:        ["coding", "general"],
};

const CREATIVE_MEDIA_KEYWORDS = ["movie", "film", "screenplay", "screen play", "storyboard", "story", "scene", "dialogue", "scripted", "character", "screenwriter"];

function isCreativeNarrativePrompt(prompt: string) {
  const lower = prompt.toLowerCase();
  return CREATIVE_MEDIA_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function findMatchedCategories(prompt: string, options: Partial<SearchOptions>) {
  const lower = prompt.toLowerCase();
  const detected: string[] = [];
  const creative = isCreativeNarrativePrompt(prompt);

  for (const [category, keywords] of Object.entries(KEYWORD_MAP)) {
    if (keywords.some((kw) => lower.includes(kw))) detected.push(category);
  }

  if (creative) {
    if (!detected.includes("writing")) detected.unshift("writing");
    if (!detected.includes("video")) detected.unshift("video");
    return detected.filter((category) => category !== "coding");
  }

  if (options.goal && GOAL_CATEGORY_MAP[options.goal]) {
    for (const cat of GOAL_CATEGORY_MAP[options.goal]) {
      if (!detected.includes(cat)) detected.push(cat);
    }
  }

  return detected.length > 0 ? detected : ["general"];
}

function getBudgetFit(tool: Tool, budget: string) {
  if (!budget) return 0;
  const price = tool.monthlyPrice ?? 999;
  if (budget === "free") {
    return tool.pricingType === "free" ? 22 : price <= 10 ? 8 : -8;
  }
  if (budget === "low") {
    return tool.pricingType === "free" ? 12 : price <= 10 ? 10 : price <= 20 ? 4 : -6;
  }
  if (budget === "medium") {
    return tool.pricingType === "free" ? 6 : price <= 20 ? 10 : price <= 40 ? 6 : -2;
  }
  if (budget === "high") {
    return tool.pricingType === "paid" ? 6 : 0;
  }
  return 0;
}

function getSkillFit(tool: Tool, skill: string) {
  if (!skill) return 0;
  if (skill === "beginner") {
    if (tool.category === "coding") return -8;
    if (["design", "writing", "general", "research"].includes(tool.category)) return 10;
    return 4;
  }
  if (skill === "advanced") {
    if (["coding", "research"].includes(tool.category)) return 10;
    if ((tool.contextLength ?? 0) >= 100000) return 8;
    return 4;
  }
  return 3;
}

function getContextFit(tool: Tool, prompt: string) {
  const lower = prompt.toLowerCase();
  const needsLongContext = ["long", "document", "documents", "repo", "codebase", "research", "paper", "pdf", "meeting", "transcript", "conversation", "project", "multi-file", "large context"].some((kw) => lower.includes(kw));

  const contextLength = tool.contextLength ?? 0;
  if (!needsLongContext) return 0;
  if (contextLength >= 200000) return 16;
  if (contextLength >= 100000) return 12;
  if (contextLength >= 32000) return 8;
  return 0;
}

function getCategoryFit(tool: Tool, categories: string[]) {
  const match = categories.includes(tool.category);
  let score = match ? 28 : 0;
  if (categories.includes("writing") && tool.category === "coding") score -= 10;
  if (categories.includes("video") && tool.category === "coding") score -= 10;
  return score;
}

function getGoalFit(tool: Tool, options: Partial<SearchOptions>) {
  if (!options.goal) return 0;
  const preferred = GOAL_CATEGORY_MAP[options.goal] || [];
  if (preferred.includes(tool.category)) return 16;
  return 0;
}

function getPromptKeywordFit(tool: Tool, prompt: string) {
  const lower = prompt.toLowerCase();
  let score = 0;
  const tokens = lower.split(/[^a-z0-9]+/).filter(Boolean);

  for (const strength of tool.strengths) {
    const strengthLower = strength.toLowerCase();
    const matched = tokens.filter((token) => strengthLower.includes(token));
    if (matched.length > 0) score += 4;
  }

  if (tool.strengths.some((s) => lower.includes(s.toLowerCase().split(" ")[0]))) score += 2;
  return score;
}

function scoreToolAgainstPrompt(tool: Tool, prompt: string, options: Partial<SearchOptions>): number {
  const lower = prompt.toLowerCase();
  const categories = findMatchedCategories(prompt, options);
  const budget = options.budget || (lower.includes("free") || lower.includes("cheap") || lower.includes("low budget") ? "free" : "");
  const skill = options.skillLevel || (lower.includes("beginner") || lower.includes("no code") || lower.includes("don't know how to code") ? "beginner" : lower.includes("advanced") ? "advanced" : "");

  let score = 0;
  score += getCategoryFit(tool, categories);
  score += getGoalFit(tool, options);
  score += getBudgetFit(tool, budget);
  score += getSkillFit(tool, skill);
  score += getContextFit(tool, prompt);
  score += getPromptKeywordFit(tool, prompt);

  if (options.timeline === "today" || options.timeline === "this_week") {
    score += tool.pricingType === "free" ? 4 : (tool.monthlyPrice !== null && tool.monthlyPrice <= 15 ? 2 : 0);
  }

  const isCodingPrompt = categories.includes("coding") || options.goal === "build_app" || lower.includes("code") || lower.includes("debug") || lower.includes("developer");
  const isCreative = isCreativeNarrativePrompt(prompt);
  if (isCodingPrompt && !isCreative) {
    if (tool.id === "claude_3_5_sonnet") score += 18;
    if (["cursor", "github_copilot"].includes(tool.id)) score += 12;
  }
  if (isCreative && tool.category === "writing") {
    score += 10;
  }
  if (isCreative && tool.category === "video") {
    score += 8;
  }
  if (isCreative && tool.category === "coding") {
    score -= 12;
  }

  if (options.teamSize === "large_team") {
    score += ["notion_ai", "jasper", "synthesia", "otter_ai"].includes(tool.id) ? 6 : 0;
  }

  return score;
}

function buildReason(tool: Tool, prompt: string, options: Partial<SearchOptions>, categories: string[], scoreBreakdown: string[]) {
  const budget = options.budget || "flexible";
  const skill = options.skillLevel || "intermediate";
  const strengths = tool.strengths.slice(0, 2).join(" and ");
  const categoryText = categories[0] || "general";
  const fitBits = [] as string[];

  if (scoreBreakdown.includes("task")) fitBits.push(`matches ${categoryText} work`);
  if (scoreBreakdown.includes("budget")) fitBits.push(`fits a ${budget} budget`);
  if (scoreBreakdown.includes("skill")) fitBits.push(`works for ${skill} users`);
  if (scoreBreakdown.includes("context") && tool.contextLength !== null && VERIFIED_TOOL_IDS.has(tool.id)) {
    fitBits.push(`supports about ${tool.contextLength.toLocaleString()} tokens of context`);
  }

  const summary = fitBits.length > 0 ? fitBits.join(", ") : `matches your request well`;
  return `Best fit because it ${summary} and its strengths include ${strengths.toLowerCase()}.`;
}

function normalizeScore(raw: number) {
  return Math.min(98, Math.max(55, raw));
}

export function heuristicRecommend(userPrompt: string, options: Partial<SearchOptions> = {}): ClientRecommendationResult {
  const tools = toolsData as Tool[];
  const lower = userPrompt.toLowerCase();
  const wantsFree = options.budget === "free" || (!options.budget && (lower.includes("free") || lower.includes("low budget")));
  const isBeginner = options.skillLevel === "beginner" || (!options.skillLevel && (lower.includes("beginner") || lower.includes("no code")));

  const detectedCategories = findMatchedCategories(userPrompt, options);

  const scored = tools
    .map((tool) => {
      const score = scoreToolAgainstPrompt(tool, userPrompt, options);
      const breakdown = [] as string[];
      if (getCategoryFit(tool, detectedCategories) > 0 || getGoalFit(tool, options) > 0) breakdown.push("task");
      if (getBudgetFit(tool, options.budget || (wantsFree ? "free" : "")) !== 0) breakdown.push("budget");
      if (getSkillFit(tool, options.skillLevel || (isBeginner ? "beginner" : "")) !== 0) breakdown.push("skill");
      if (getContextFit(tool, userPrompt) > 0) breakdown.push("context");
      return { tool, score, breakdown };
    })
    .filter((t) => t.score > 0)
    .sort((a, b) => b.score - a.score);

  const picked: typeof scored = [];
  const seenCategories = new Set<string>();
  for (const entry of scored) {
    if (picked.length >= 4) break;
    if (!seenCategories.has(entry.tool.category)) {
      picked.push(entry);
      seenCategories.add(entry.tool.category);
    }
  }
  for (const entry of scored) {
    if (picked.length >= 4) break;
    if (!picked.some((p) => p.tool.id === entry.tool.id)) picked.push(entry);
  }
  if (picked.length === 0) {
    picked.push({ tool: tools[0], score: 60, breakdown: ["task", "budget"] }, { tool: tools[1], score: 58, breakdown: ["task", "skill"] }, { tool: tools[11], score: 54, breakdown: ["task"] });
  }

  const creativePrompt = isCreativeNarrativePrompt(userPrompt);
  const workflowStages = creativePrompt
    ? ["Concept & Script", "Draft & Refine", "Visualize & Publish"]
    : options.goal === "build_app"
    ? ["Plan & Design", "Build & Code", "Test & Deploy"]
    : options.goal === "create_content" || options.goal === "generate_media"
    ? ["Ideate", "Create", "Publish"]
    : options.goal === "write_edit"
    ? ["Research", "Draft", "Edit & Publish"]
    : ["Research & Planning", "Build & Create", "Publish & Distribute"];

  const workflow = picked.slice(0, 3).map((p, i) => ({
    stage: workflowStages[i] || `Step ${i + 1}`,
    tool: p.tool,
  }));

  const budgetValue = options.budget || (wantsFree ? "free" : "unspecified");

  return {
    extracted_requirements: {
      project_type: options.goal?.replace(/_/g, " ") || detectedCategories[0] || "General",
      skill_level: isBeginner ? "beginner" : (options.skillLevel || "intermediate"),
      budget: (budgetValue as any) || "unspecified",
      needs: [...new Set([...detectedCategories, ...(options.goal ? [options.goal.replace(/_/g, " ")] : [])].slice(0, 5))],
    },
    recommendations: picked.map((p) => {
      const altTool = tools.find((t) => t.category === p.tool.category && t.id !== p.tool.id);
      return {
        tool: p.tool,
        alternative_tool: altTool,
        fit_score: normalizeScore(p.score),
        reason: buildReason(p.tool, userPrompt, options, detectedCategories, p.breakdown),
        pros: p.tool.strengths,
        cons: p.tool.weaknesses,
        prompt_generator: `Using ${p.tool.name}, help me with the following: ${userPrompt}. My skill level is ${options.skillLevel || "intermediate"} and my budget is ${options.budget || "flexible"}. Focus on ${p.tool.strengths[0]?.toLowerCase()}.`,
      };
    }),
    suggested_workflow: workflow,
  };
}
