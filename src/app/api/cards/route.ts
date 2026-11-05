import { listCards } from "@/server/bank-db";
import { simulateNetwork } from "@/server/simulate-network";

// GET /api/cards → the customer's cards (last four digits only, never the full number).
export async function GET() {
  const failure = await simulateNetwork();
  if (failure) return failure;

  return Response.json(listCards());
}
