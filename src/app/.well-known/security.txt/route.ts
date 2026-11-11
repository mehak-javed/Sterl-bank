/**
 * /.well-known/security.txt (RFC 9116): the standard place where security researchers and their
 * tools look for how to report a vulnerability. Plain text.
 * "Expires" is required and must be under a year away: renew it before then.
 */
export function GET(request: Request) {
  // RFC 9116 wants full addresses, so the policy link is built from the address this was asked on.
  const policy = new URL("/security/policy", request.url).href;
  const body = [
    "Contact: mailto:security@sterl.example",
    "Expires: 2027-10-31T23:59:59.000Z",
    "Preferred-Languages: en",
    `Policy: ${policy}`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
