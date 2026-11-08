// Every experiment variable as a config flag. Copy this into your harness.
export interface HarnessConfig {
  name: string;
  toolDescriptions: "minimal" | "detailed";
  agentsMd: boolean;
  compactAt: number;
  postEditTypecheck: boolean;
  stopHookTests: boolean;
  effort: "low" | "medium" | "high" | "xhigh";
  offloadMaxChars: number;
}

export const BASELINE: HarnessConfig = {
  name: "baseline",
  toolDescriptions: "minimal",
  agentsMd: false,
  compactAt: 60_000,
  postEditTypecheck: false,
  stopHookTests: false,
  effort: "medium",
  offloadMaxChars: 8_000,
};

// TODO(09): loadConfig(path) → merge a JSON file over BASELINE and validate it (zod works well here)
