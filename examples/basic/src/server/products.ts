// server/products.ts — server-only implementations. May import your DB/services.
import { implement } from '@agentora/server';
import { createOrder, searchProducts } from '../contracts/products';

const CATALOG = [
  { id: 'p1', title: 'Running shoes', priceCents: 12000 },
  { id: 'p2', title: 'Trail shoes', priceCents: 14000 },
  { id: 'p3', title: 'Wool socks', priceCents: 1800 },
];

export const searchProductsImpl = implement(searchProducts, async ({ input, stream }) => {
  stream.log(`searching "${input.query}"`);
  const q = input.query.toLowerCase();
  const results = CATALOG.filter((p) => p.title.toLowerCase().includes(q)).slice(0, input.limit);
  return { results };
});

let orderSeq = 0;
export const createOrderImpl = implement(createOrder, async ({ input }) => {
  orderSeq += 1;
  return { orderId: `order_${input.productId}_${orderSeq}` };
});

export const impls = {
  products: { search: searchProductsImpl },
  orders: { create: createOrderImpl },
};
