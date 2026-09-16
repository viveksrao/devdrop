export const FREE_TIER_LIMITS = {
  maxItems: 50,
  maxCollections: 3,
} as const;

export const PLAN_FEATURES = {
  free: ["50 items total", "3 collections", "Snippets, Prompts, Commands, Notes, Links", "Basic search"],
  pro: [
    "Unlimited items",
    "Unlimited collections",
    "File & image uploads",
    "AI auto-tagging & summaries",
    "AI code explanation & prompt optimizer",
    "Data export (JSON/ZIP)",
    "Priority support",
  ],
} as const;
