#!/usr/bin/env node
// The `agentora` bin: `agentora dev | doctor | gen`.

const [, , command] = process.argv;

switch (command) {
  case 'dev':
    // TODO: serve every surface (HTTP + MCP) for the local app.
    console.log('agentora dev — not implemented yet');
    break;
  case 'doctor':
    // TODO: load the app, run @agentora/doctor, print the readiness report.
    console.log('agentora doctor — not implemented yet');
    break;
  case 'gen':
    // TODO: emit the manifest IR and/or the typed client.
    console.log('agentora gen — not implemented yet');
    break;
  default:
    console.log('usage: agentora <dev|doctor|gen>');
}
