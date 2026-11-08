import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface, type Interface } from "node:readline";
import { randomUUID } from "node:crypto";

// A bash process that stays alive between commands so state persists.
export class BashSession {
  process!: ChildProcessWithoutNullStreams;
  private lines!: Interface;

  constructor() {
    this.start();
  }

  private start(): void {
    this.process = spawn("/bin/bash", {
      detached: true // own process group: a timeout can kill every child
    });
    this.process.stdin.write("exec 2>&1\n"); // interleave errors with output, in order
    this.lines = createInterface({ input: this.process.stdout });
  }

  // Run a command in the session and return its output.
  executeCommand(command: string): Promise<string> {
    const sentinel = `__CLAUDE_BASH_DONE_${randomUUID()}__`; // unique for each call
    const output: string[] = [];
    const result = new Promise<string>((resolve) => {
      const onLine = (line: string): void => {
        if (line.includes(sentinel)) {
          // this command's output is complete
          this.lines.off("line", onLine);
          resolve(output.join(""));
        } else {
          output.push(`${line}\n`);
        }
      };
      this.lines.on("line", onLine);
    });
    this.process.stdin.write(`${command}\necho ${sentinel}\n`);
    return result;
  }

  restart(): void {
    this.process.kill("SIGKILL");
    this.lines.close();
    this.start();
  }
}
