import type { NextRequest } from "next/server";
import { findAccount, listTransactions } from "@/server/bank-db";
import { simulateNetwork } from "@/server/simulate-network";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// GET /api/transactions?accountId=...&limit=20 → newest transactions first.
export async function GET(request: NextRequest) {
  const failure = await simulateNetwork();
  if (failure) return failure;

  const params = request.nextUrl.searchParams;
  const accountId = params.get("accountId");
  const limitParam = params.get("limit") ?? String(DEFAULT_LIMIT);

  // Never trust input, even from our own frontend: check it and say clearly what's wrong.
  if (!accountId) {
    return Response.json({ error: "accountId is required" }, { status: 400 });
  }
  if (!/^\d+$/.test(limitParam) || Number(limitParam) < 1 || Number(limitParam) > MAX_LIMIT) {
    return Response.json({ error: `limit must be a whole number from 1 to ${MAX_LIMIT}` }, { status: 400 });
  }
  if (!findAccount(accountId)) {
    return Response.json({ error: "Account not found" }, { status: 404 });
  }

  return Response.json(listTransactions(accountId, Number(limitParam)));
}
