import type { NextRequest } from "next/server";
import { setCardFrozen } from "@/server/bank-db";
import { simulateNetwork } from "@/server/simulate-network";

// PATCH /api/cards/:id  with body {"frozen": true | false} → the updated card.
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/cards/[id]">) {
  const failure = await simulateNetwork();
  if (failure) return failure; // fails BEFORE changing anything, so a retry is safe

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON" }, { status: 400 });
  }
  // `unknown` forces us to check the shape before using it. Day 12 swaps this for Zod.
  if (typeof body !== "object" || body === null || !("frozen" in body) || typeof body.frozen !== "boolean") {
    return Response.json({ error: 'Body must be {"frozen": true} or {"frozen": false}' }, { status: 400 });
  }

  const card = setCardFrozen(id, body.frozen);
  if (!card) {
    return Response.json({ error: "Card not found" }, { status: 404 });
  }
  return Response.json(card);
}
