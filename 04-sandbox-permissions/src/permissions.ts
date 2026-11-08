// TODO(04): permission gate. deny > ask > allow; unmatched → DEFAULT.
export type Decision = "allow" | "ask" | "deny";

export const DEFAULT: Decision = "ask";

export function decide(command: string): Decision {
  // TODO:
  // 1. split on && || ; |
  // 2. classify each part with deny / ask / allow rules
  // 3. return the strictest
  void command;
  return DEFAULT;
}
