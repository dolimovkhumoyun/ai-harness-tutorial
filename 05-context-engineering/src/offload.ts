// TODO(05): keep head + tail of large outputs, save the full text to disk.
export interface OffloadOptions {
  maxChars: number;   // below this, return output unchanged
  headChars: number;
  tailChars: number;
  saveDir?: string;   // if set, write the full output here and mention the path
  label?: string;     // used in the file name, e.g. "turn7-bash"
}

export interface OffloadResult {
  text: string;        // what goes into the tool_result
  truncated: boolean;
  savedTo?: string;
}

export function offload(output: string, opts: OffloadOptions): OffloadResult {
  // TODO: if output.length <= maxChars → unchanged
  // else: header line with original size, head, "…", tail, and the saved path
  void opts;
  return { text: output, truncated: false };
}
