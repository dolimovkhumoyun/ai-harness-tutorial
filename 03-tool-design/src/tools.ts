// Placeholder so this module typechecks before you copy 02's src in.
// `cp -n` won't overwrite this file. Delete it first, or merge by hand:
//   rm 03-tool-design/src/tools.ts && cp -n 02-tracing/src/*.ts 03-tool-design/src/
export interface ToolOutput {
  content: string;
  isError: boolean;
}
