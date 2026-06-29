// contracts/products.ts — pure, isomorphic, shippable anywhere.
import { defineContract, s } from '@agentora/core';

const product = s.object({
  id: s.string(),
  title: s.string(),
  priceCents: s.number(),
});

export const searchProducts = defineContract({
  name: 'products.search',
  description: 'Search the product catalog by free text.',
  sideEffects: 'read',
  input: s.object({
    query: s.string().min(1).describe('Free-text search query'),
    limit: s.number().default(10),
  }),
  output: s.object({ results: s.array(product) }),
});

export const createOrder = defineContract({
  name: 'orders.create',
  description: 'Place an order for a product.',
  sideEffects: 'write',
  idempotency: 'always',
  auth: { scopes: ['orders:write'] },
  concurrency: 8,
  input: s.object({ productId: s.string(), quantity: s.number().default(1) }),
  output: s.object({ orderId: s.string() }),
});

export const contracts = { products: { search: searchProducts }, orders: { create: createOrder } };
