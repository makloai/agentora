// @agentora/cli — turn an agentora app into a CLI, and the `agentora` bin.
import { type App } from '@agentora/server';

/** Build a CLI program from an app: one subcommand per action, flags from input schema. */
export function toCli(_app: App): { run(argv: string[]): Promise<void> } {
  return {
    async run(_argv: string[]) {
      // TODO: parse flags / JSON stdin from the input schema, invoke the action,
      // print JSON output; non-zero exit on AgentoraError.
    },
  };
}
