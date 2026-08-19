export type NarrativeOrigin = "llm" | "template";

export type NarrativeMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};
