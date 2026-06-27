// client.ts — built from CONTRACTS only; safe in a browser bundle.
import { createClient } from '@agentora/client';
import type { contracts } from './contracts/products';

export const client = createClient<typeof contracts>({ url: '/api' });
// client.products.search({ query: 'shoes' })  ← typed, zero server code
