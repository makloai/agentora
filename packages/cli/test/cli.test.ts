import { defineContract, s } from '@agentora/core';
import { createApp, implement, router } from '@agentora/server';
import { describe, expect, it, vi } from 'vitest';
import { type CliIo, manifestJson, parseInput, toCli } from '../src/index';

const search = defineContract({
  name: 'products.search',
  description: 'Search the catalog',
  input: s.object({
    query: s.string(),
    limit: s.number().default(10),
    verbose: s.boolean().optional(),
  }),
  output: s.object({ ids: s.array(s.string()) }),
});

function setup(impl = async () => ({ ids: ['a'] })) {
  const app = createApp({
    router: router({ products: { search: implement(search, impl) } }),
  });
  const out: string[] = [];
  const err: string[] = [];
  const exit = vi.fn();
  const io: CliIo = { out: (l) => out.push(l), err: (l) => err.push(l), exit };
  return { cli: toCli(app, io), app, out, err, exit };
}

describe('parseInput', () => {
  it('coerces flags by the schema property type', () => {
    const input = parseInput(
      {
        properties: {
          query: { type: 'string' },
          limit: { type: 'number' },
          verbose: { type: 'boolean' },
        },
      },
      ['--query', 'shoes', '--limit', '5', '--verbose']
    );
    expect(input).toEqual({ query: 'shoes', limit: 5, verbose: true });
  });

  it('accepts a whole-payload --json escape hatch', () => {
    expect(parseInput({}, ['--json', '{"query":"x"}'])).toEqual({ query: 'x' });
  });
});

describe('toCli', () => {
  it('invokes the action and prints JSON output', async () => {
    const { cli, out } = setup(async () => ({ ids: ['x', 'y'] }));
    await cli.run(['products.search', '--query', 'shoes']);
    expect(JSON.parse(out.join('\n'))).toEqual({ ids: ['x', 'y'] });
  });

  it('exits non-zero on an unknown action', async () => {
    const { cli, exit, err } = setup();
    await cli.run(['ghost']);
    expect(exit).toHaveBeenCalledWith(1);
    expect(err.join('\n')).toContain('unknown action');
  });

  it('exits non-zero and reports AgentoraError on a failing action', async () => {
    const { cli, exit, err } = setup(async () => {
      throw new Error('downstream down');
    });
    await cli.run(['products.search', '--query', 'q']);
    expect(exit).toHaveBeenCalledWith(1);
    expect(err.join('\n')).toContain('INTERNAL');
  });

  it('prints usage with no action', async () => {
    const { cli, out } = setup();
    await cli.run([]);
    expect(out.join('\n')).toContain('products.search');
  });
});

describe('manifestJson', () => {
  it('emits a manifest matching app.manifest()', () => {
    const { app } = setup();
    expect(JSON.parse(manifestJson(app))).toEqual(app.manifest());
  });
});
