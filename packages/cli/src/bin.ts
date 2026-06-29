#!/usr/bin/env node
// The `agentora` bin: `agentora dev | doctor | gen`.
//
// Each command loads the user's app module (default ./agentora.app.js, override
// with --app <path>), whose default export is the createApp() result.

import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { doctor } from '@agentora/doctor';
import { toFetchHandler } from '@agentora/http';
import type { App } from '@agentora/server';
import { manifestJson } from './index';
import { renderReport, reportExitCode } from './report';

const [, , command, ...rest] = process.argv;

function flag(name: string, fallback?: string): string | undefined {
  const i = rest.indexOf(`--${name}`);
  return i === -1 ? fallback : rest[i + 1];
}

async function loadApp(): Promise<App> {
  const path = flag('app', './agentora.app.js') as string;
  const mod = await import(pathToFileURL(path).href);
  const app = mod.default ?? mod.app;
  if (!app?.manifest) {
    throw new Error(`module ${path} does not default-export an agentora app`);
  }
  return app as App;
}

async function main() {
  switch (command) {
    case 'doctor': {
      const app = await loadApp();
      const report = doctor(app.manifest());
      console.log(
        renderReport(
          report,
          app.manifest().actions.map((a) => a.name)
        )
      );
      process.exitCode = reportExitCode(report);
      break;
    }
    case 'gen': {
      const app = await loadApp();
      const json = manifestJson(app);
      const out = flag('out');
      if (out) {
        const { writeFile } = await import('node:fs/promises');
        await writeFile(out, json);
        console.log(`wrote manifest to ${out}`);
      } else {
        console.log(json);
      }
      break;
    }
    case 'dev': {
      const app = await loadApp();
      const handler = toFetchHandler(app);
      const port = Number(flag('port', '8787'));
      serve(handler, port);
      console.log(`agentora dev — HTTP on http://localhost:${port} (POST /<action>)`);
      console.log('MCP stdio available via toMcp(app).start()');
      break;
    }
    default:
      console.log('usage: agentora <dev|doctor|gen> [--app <path>]');
  }
}

/** Minimal node:http → Web fetch bridge for `agentora dev`. */
function serve(handler: (req: Request) => Promise<Response>, port: number): void {
  createServer(async (nodeReq, nodeRes) => {
    const chunks: Buffer[] = [];
    for await (const chunk of nodeReq) {
      chunks.push(chunk as Buffer);
    }
    const url = `http://localhost:${port}${nodeReq.url ?? '/'}`;
    const request = new Request(url, {
      method: nodeReq.method,
      headers: nodeReq.headers as Record<string, string>,
      body: chunks.length ? Buffer.concat(chunks) : undefined,
    });
    const response = await handler(request);
    nodeRes.statusCode = response.status;
    response.headers.forEach((value, key) => nodeRes.setHeader(key, value));
    nodeRes.end(Buffer.from(await response.arrayBuffer()));
  }).listen(port);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
