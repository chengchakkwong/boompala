import type {
  AnalysisResult,
  AnalysisVersion,
  ConversationMessage,
  VersionSource,
} from "@/lib/types/meal";

export function analysisToVersion(
  analysis: AnalysisResult,
  versionIndex: number,
  source: VersionSource,
): AnalysisVersion {
  return {
    version_index: versionIndex,
    source,
    ...analysis,
  };
}

export function versionLabel(versionIndex: number): string {
  return versionIndex === 0 ? "初版 (v0)" : `修正 ${versionIndex} (v${versionIndex})`;
}

export function chosenVersionLabel(chosenIndex: number): string {
  return chosenIndex === 0 ? "初版 (v0)" : `修正 ${chosenIndex} (v${chosenIndex})`;
}

export function stripVersionMeta(version: AnalysisVersion): AnalysisResult {
  const { version_index: _vi, source: _s, ...rest } = version;
  return rest;
}

export function appendUserMessage(
  conversation: ConversationMessage[],
  content: string,
  versionIndex: number,
): ConversationMessage[] {
  return [
    ...conversation,
    { role: "user", content, version_index: versionIndex },
  ];
}

export function appendAssistantMessage(
  conversation: ConversationMessage[],
  analysis: AnalysisResult,
  versionIndex: number,
): ConversationMessage[] {
  return [
    ...conversation,
    {
      role: "assistant",
      content: analysis.cheeky_cat_comment,
      version_index: versionIndex,
      cheeky_cat_comment: analysis.cheeky_cat_comment,
    },
  ];
}
