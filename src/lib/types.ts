export interface SearchOptions {
  budget: "free" | "low" | "medium" | "high" | "";
  skillLevel: "beginner" | "intermediate" | "advanced" | "";
  timeline: "today" | "this_week" | "this_month" | "long_term" | "";
  goal: "build_app" | "create_content" | "write_edit" | "research" | "design_ui" | "generate_media" | "automate" | "";
  teamSize: "solo" | "small_team" | "large_team" | "";
}

export interface Tool {
  id: string;
  name: string;
  logoURL: string;
  category: "coding" | "image" | "writing" | "research" | "design" | "video" | "audio" | "general" | string;
  pricingType: "free" | "paid" | string;
  monthlyPrice: number | null;
  contextLength: number | null;
  strengths: string[];
  weaknesses: string[];
  websiteLink: string;
  lastUpdated: string;
}

export interface RecommendationResponse {
  extracted_requirements: {
    project_type: string;
    skill_level: "beginner" | "intermediate" | "advanced";
    budget: "free" | "low" | "medium" | "high" | "unspecified";
    needs: string[];
  };
  recommendations: Array<{
    tool_id: string;
    fit_score: number;
    reason: string;
    pros: string[];
    cons: string[];
    prompt_generator: string;
  }>;
  suggested_workflow: Array<{
    stage: string;
    tool_id: string;
  }>;
}

export interface EnrichedRecommendation {
  tool: Tool;
  alternative_tool?: Tool;
  fit_score: number;
  reason: string;
  pros: string[];
  cons: string[];
  prompt_generator: string;
}

export interface EnrichedWorkflowStage {
  stage: string;
  tool: Tool;
}

export interface ClientRecommendationResult {
  extracted_requirements: RecommendationResponse["extracted_requirements"];
  recommendations: EnrichedRecommendation[];
  suggested_workflow?: EnrichedWorkflowStage[];
}
