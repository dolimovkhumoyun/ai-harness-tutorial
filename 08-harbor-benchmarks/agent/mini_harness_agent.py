"""TODO(08): run your TypeScript harness as a Harbor installed agent.

Run:
  PYTHONPATH=08-harbor-benchmarks/agent harbor run -p 08-harbor-benchmarks/tasks \
    -a mini_harness_agent:MiniHarnessAgent -m anthropic/claude-opus-5-5 \
    --ae ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
"""

import shlex

from harbor.agents.installed.base import BaseInstalledAgent, with_prompt_template
from harbor.environments.base import BaseEnvironment
from harbor.models.agent.context import AgentContext


class MiniHarnessAgent(BaseInstalledAgent):
    @staticmethod
    def name() -> str:
        return "mini-harness"

    async def install(self, environment: BaseEnvironment) -> None:
        # TODO 1: make sure Node 20+ exists (exec_as_root), e.g. check `node -v` first
        # TODO 2: install your harness, e.g. npm install -g github:<you>/<repo>
        raise NotImplementedError

    @with_prompt_template
    async def run(
        self,
        instruction: str,
        environment: BaseEnvironment,
        context: AgentContext,
    ) -> None:
        # TODO 3: run your CLI with the local executor, in the task's working directory
        await self.exec_as_agent(
            environment,
            command=f"mini-harness --executor local {shlex.quote(instruction)}",
        )

    # TODO 4 (stretch): override populate_context_post_run to parse your final JSON line
    # into token usage / cost on the AgentContext.
