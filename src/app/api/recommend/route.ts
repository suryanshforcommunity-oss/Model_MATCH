import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";
import toolsData from "@/data/tools.json";
import { Tool, ClientRecommendationResult, SearchOptions } from "@/lib/types";
import { heuristicRecommend } from "@/lib/heuristicEngine";

export const maxDuration = 60;

const VERIFIED_TOOL_IDS = new Set(["chatgpt_plus", "claude_3_5_sonnet", "github_copilot", "cursor", "perplexity_pro", "gemini_advanced", "midjourney_v6", "canva_magic_studio", "runway_gen3", "elevenlabs"]);

export async function POST(req: Request) {
  let prompt: string;
  let options: Partial<SearchOptions> = {};

  try {
    const body = await req.json();
    prompt = body.prompt;
    options = body.options || {};
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
  }

  // Build a rich context string from the options to inject into the LLM prompt
  const optionsContext = [
    options.budget       ? `Budget: ${options.budget}`                                      : "",
    options.skillLevel   ? `Skill level: ${options.skillLevel}`                             : "",
    options.timeline     ? `Timeline: ${options.timeline.replace(/_/g, " ")}`               : "",
    options.goal         ? `Primary goal: ${options.goal.replace(/_/g, " ")}`               : "",
    options.teamSize     ? `Team size: ${options.teamSize.replace(/_/g, " ")}`              : "",
  ].filter(Boolean).join("\n");

  try {
    const tools = toolsData as Tool[];
    const idMap = new Map<string, Tool>();

    const anonymizedDataset = tools.map((tool, index) => {
      const anonymizedId = `tool_${String(index + 1).padStart(2, "0")}`;
      idMap.set(anonymizedId, tool);
      return {
        id: anonymizedId,
        category: tool.category,
        pricingType: tool.pricingType,
        monthlyPrice: VERIFIED_TOOL_IDS.has(tool.id) ? tool.monthlyPrice : null,
        contextLength: VERIFIED_TOOL_IDS.has(tool.id) ? tool.contextLength : null,
        strengths: tool.strengths,
        weaknesses: tool.weaknesses,
      };
    });

    const recommendationSchema = z.object({
      extracted_requirements: z.object({
        project_type: z.string(),
        skill_level: z.enum(["beginner", "intermediate", "advanced"]),
        budget: z.enum(["free", "low", "medium", "high", "unspecified"]),
        needs: z.array(z.string()),
      }),
      recommendations: z.array(
        z.object({
          tool_id: z.string(),
          alternative_tool_id: z.string().nullable().describe("A secondary tool ID that belongs to the same category as tool_id that serves as an alternate option, or null if none."),
          fit_score: z.number().min(0).max(100),
          reason: z.string(),
          pros: z.array(z.string()),
          cons: z.array(z.string()),
          prompt_generator: z.string(),
        })
      ).min(1).max(6),
      suggested_workflow: z.array(
        z.object({
          stage: z.string(),
          tool_id: z.string(),
        })
      ).describe("Return empty array if not needed."),
    });

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      maxRetries: 0,
      schema: recommendationSchema,
      prompt: `
You are an expert AI recommendation engine. Compare 3-6 tools for the user's project by fit, cost, context window, strengths, and tradeoffs.
For each tool recommended, also suggest an alternative_tool_id from the available dataset that represents a secondary alternate option of the same category (e.g. if recommending a coding tool, provide a different coding tool as the alternate).
Consider ALL tools equally — do not favor well-known brands. Diversity across categories matters. Use a broad mix of current, widely available tools from the dataset and avoid repeating the same tool family or brand for the same workflow stage.

User Project Description:
"${prompt}"

${optionsContext ? `User Preferences:\n${optionsContext}` : ""}

Available Tool Dataset (Anonymized):
${JSON.stringify(anonymizedDataset, null, 2)}

Rules:
- Only use exact tool IDs from the dataset above (e.g. "tool_01"). Do not invent tools.
- Respect user budget: if budget is "free" or "low", strongly prefer free tools.
- Respect skill level: if beginner, avoid complex developer tools.
- Respect timeline: if "today" or "this_week", pick tools that are quick to start.
- Fit score 0-100 based on how well the tool matches all stated requirements. The primary best option should have a fit score between 92-98. Other options should scale realistically between 70-89 based on their tradeoffs. Do not default to 55%.
- Generate a tailored ready-to-paste prompt per tool, reflecting the user's goal.
- If project spans multiple phases, suggest a multi-tool workflow.
      `,
    });

    const clientResult: ClientRecommendationResult = {
      extracted_requirements: object.extracted_requirements,
      recommendations: object.recommendations
        .map((rec) => {
          const tool = idMap.get(rec.tool_id);
          if (!tool) return null;
          const altTool = rec.alternative_tool_id ? idMap.get(rec.alternative_tool_id) : undefined;
          return {
            tool,
            alternative_tool: altTool,
            fit_score: rec.fit_score,
            reason: rec.reason,
            pros: rec.pros,
            cons: rec.cons,
            prompt_generator: rec.prompt_generator
          };
        })
        .filter(Boolean) as ClientRecommendationResult["recommendations"],
      suggested_workflow: object.suggested_workflow
        ?.map((s) => {
          const tool = idMap.get(s.tool_id);
          if (!tool) return null;
          return { stage: s.stage, tool };
        })
        .filter(Boolean) as ClientRecommendationResult["suggested_workflow"],
    };

    return NextResponse.json({ ...clientResult, source: "llm" });
  } catch (error: any) {
    console.error("LLM failed, using heuristic:", error.message);
    const heuristicResult = heuristicRecommend(prompt, options);
    return NextResponse.json({ ...heuristicResult, source: "heuristic" });
  }
}
