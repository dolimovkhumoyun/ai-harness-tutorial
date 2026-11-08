// TODO(04): a throwaway Docker container per agent run.
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileP = promisify(execFile);

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
}

export class Sandbox {
  readonly name: string;

  constructor(runId: string, readonly workspaceDir: string, readonly image = "node:22-slim") {
    this.name = `agent-${runId}`;
  }

  async start(): Promise<void> {
    // TODO: docker run -d --rm --name <name> --network none --memory 1g --cpus 1
    //       -v <workspaceDir>:/workspace -w /workspace <image> sleep infinity
    void execFileP;
    throw new Error("TODO: Sandbox.start");
  }

  async exec(command: string, timeoutMs = 30_000): Promise<ExecResult> {
    // TODO: docker exec <name> sh -c <command>, with timeout; never throw on a non-zero exit
    void command; void timeoutMs;
    throw new Error("TODO: Sandbox.exec");
  }

  async stop(): Promise<void> {
    // TODO: docker rm -f <name> (ignore errors)
  }
}
