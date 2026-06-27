// @agentora/cli — turn an agentora app into a CLI, and the `agentora` bin.
import { AgentoraError, type Manifest } from '@agentora/core';
import type { AnyApp } from '@agentora/server';

/** Injected IO so the CLI is testable without touching the real process. */
export interface CliIo {
  out: (line: string) => void;
  err: (line: string) => void;
  exit: (code: number) => void;
}

const defaultIo: CliIo = {
  out: (line) => console.log(line),
  err: (line) => console.error(line),
  exit: (code) => {
    process.exitCode = code;
  },
};

export interface Cli {
  run(argv: string[]): Promise<void>;
}

/** Build a CLI program from an app: one subcommand per action, flags from input schema. */
export function toCli(app: AnyApp, io: CliIo = defaultIo): Cli {
  const manifest = app.manifest();

  return {
    async run(argv: string[]) {
      const [name, ...rest] = argv;
      if (!name || name === '--help' || name === '-h') {
        io.out(usage(manifest));
        return;
      }

      const entry = manifest.actions.find((a) => a.name === name);
      if (!entry) {
        io.err(`unknown action: ${name}`);
        io.out(usage(manifest));
        io.exit(1);
        return;
      }

      let input: unknown;
      try {
        input = parseInput(entry.input, rest);
      } catch (err) {
        io.err(err instanceof Error ? err.message : String(err));
        io.exit(1);
        return;
      }

      try {
        const output = await app.invoke(name, input);
        io.out(JSON.stringify(output, null, 2));
      } catch (err) {
        if (err instanceof AgentoraError) {
          io.err(`${err.code}: ${err.message}`);
        } else {
          io.err(err instanceof Error ? err.message : String(err));
        }
        io.exit(1);
      }
    },
  };
}

/** The manifest IR as pretty JSON — what `agentora gen` emits. */
export function manifestJson(app: AnyApp): string {
  return JSON.stringify(app.manifest(), null, 2);
}

function usage(manifest: Manifest): string {
  const lines = ['usage: <action> [--flag value | --json <json>]', '', 'actions:'];
  for (const action of manifest.actions) {
    lines.push(`  ${action.name}${action.description ? ` — ${action.description}` : ''}`);
  }
  return lines.join('\n');
}

/** Map `--flag value` args (or `--json <obj>`) to a typed input per the schema. */
export function parseInput(schema: unknown, args: string[]): unknown {
  // Whole-payload JSON escape hatch: --json '{...}'
  const jsonIndex = args.indexOf('--json');
  if (jsonIndex !== -1) {
    return JSON.parse(args[jsonIndex + 1] ?? '{}');
  }

  const props = (schema as { properties?: Record<string, { type?: string }> }).properties ?? {};
  const out: Record<string, unknown> = {};

  for (let i = 0; i < args.length; i++) {
    const token = args[i];
    if (!token?.startsWith('--')) {
      continue;
    }
    const key = token.slice(2);
    const type = props[key]?.type;
    if (type === 'boolean') {
      out[key] = true;
      continue;
    }
    const raw = args[++i];
    out[key] = coerce(raw, type);
  }
  return out;
}

function coerce(raw: string | undefined, type: string | undefined): unknown {
  if (raw === undefined) {
    return undefined;
  }
  if (type === 'number') {
    const n = Number(raw);
    if (Number.isNaN(n)) {
      throw new Error(`expected a number, got "${raw}"`);
    }
    return n;
  }
  if (type === 'boolean') {
    return raw === 'true';
  }
  return raw;
}
