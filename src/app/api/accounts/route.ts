import { listAccounts } from "@/server/bank-db";
import { simulateNetwork } from "@/server/simulate-network";

// GET /api/accounts → every account for the (single, fake) signed-in customer.
export async function GET() {
  const failure = await simulateNetwork();
  if (failure) return failure;

  return Response.json(listAccounts());
}
