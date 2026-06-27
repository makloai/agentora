// @agentora/core/manifest — walk a router tree and emit the manifest IR.
// The manifest is the JSON-serializable source of truth every surface reads.

import type { Contract, Manifest, ManifestEntry, RouterNode } from './index';
import { resolveJsonSchema } from './resolve';

/** An implemented node, as held by a server-side router (`{ contract, handler }`). */
interface ImplementedNode {
  readonly contract: Contract;
}

function isContract(node: RouterNode): node is Contract {
  const n = node as Partial<Contract>;
  return typeof n.name === 'string' && 'input' in n && 'output' in n;
}

function isImplemented(node: RouterNode): node is RouterNode & ImplementedNode {
  const n = node as Partial<ImplementedNode>;
  return !!n.contract && isContract(n.contract as RouterNode);
}

/** Walk a router tree (contracts, implemented nodes, nested groups) into the manifest IR. */
export function toManifest(tree: Record<string, RouterNode>): Manifest {
  const actions: ManifestEntry[] = [];
  walk(tree, actions);
  return { version: 1, actions };
}

function walk(node: RouterNode, actions: ManifestEntry[]): void {
  if (isImplemented(node)) {
    actions.push(entryOf(node.contract));
    return;
  }
  if (isContract(node)) {
    actions.push(entryOf(node));
    return;
  }
  // Nested group: recurse in declaration order.
  for (const child of Object.values(node)) {
    walk(child, actions);
  }
}

function entryOf(contract: Contract): ManifestEntry {
  return {
    name: contract.name,
    ...(contract.description !== undefined ? { description: contract.description } : {}),
    sideEffects: contract.sideEffects ?? 'none',
    idempotency: contract.idempotency ?? 'none',
    input: resolveJsonSchema(contract.input, 'input'),
    output: resolveJsonSchema(contract.output, 'output'),
  };
}
